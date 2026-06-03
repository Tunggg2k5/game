import { z } from "zod";
import {
  authGuard,
  canChangeBefore24Hours,
  fail,
  isGuardError,
  normalizeDateOnly,
  ok,
  toJson,
} from "@/lib/api";
import { writeAudit } from "@/lib/audit";
import { connectMongo } from "@/lib/mongodb";
import { appointmentStatuses } from "@/lib/types";
import type { Role } from "@/lib/types";
import { Appointment } from "@/models/Appointment";
import { DentalService } from "@/models/DentalService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createAppointmentSchema = z.object({
  patient: z.string().optional(),
  dentist: z.string().min(1),
  nurse: z.string().optional().or(z.literal("")),
  service: z.string().min(1),
  appointmentDate: z.string().min(10),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  symptoms: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

const patchAppointmentSchema = z.object({
  _id: z.string().min(1),
  action: z.enum([
    "confirm",
    "reject",
    "checkIn",
    "startTreatment",
    "complete",
    "cancel",
    "reschedule",
    "noShow",
    "assignNurse",
    "setStatus",
    "review",
    "note",
  ]),
  status: z.enum(appointmentStatuses).optional(),
  appointmentDate: z.string().optional(),
  startTime: z.string().optional(),
  nurse: z.string().optional().or(z.literal("")),
  rating: z.coerce.number().min(1).max(5).optional(),
  review: z.string().optional().or(z.literal("")),
  reason: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

function addMinutes(time: string, minutesToAdd: number) {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date(Date.UTC(2000, 0, 1, hours || 0, minutes || 0));
  date.setUTCMinutes(date.getUTCMinutes() + minutesToAdd);
  return `${String(date.getUTCHours()).padStart(2, "0")}:${String(
    date.getUTCMinutes(),
  ).padStart(2, "0")}`;
}

function roleCanPatch(role: Role, action: string) {
  const receptionistActions = [
    "confirm",
    "reject",
    "checkIn",
    "cancel",
    "reschedule",
    "noShow",
    "assignNurse",
    "setStatus",
    "note",
  ];
  const dentistActions = ["startTreatment", "complete", "note"];
  const nurseActions = ["startTreatment", "complete", "note"];
  const patientActions = ["cancel", "reschedule", "review", "note"];

  if (role === "admin") return true;
  if (role === "receptionist") return receptionistActions.includes(action);
  if (role === "dentist") return dentistActions.includes(action);
  if (role === "nurse") return nurseActions.includes(action);
  if (role === "patient") return patientActions.includes(action);
  return false;
}

async function assertSlotAvailable(
  dentist: string,
  appointmentDate: Date,
  startTime: string,
  excludeId?: string,
) {
  const conflict = await Appointment.findOne({
    dentist,
    appointmentDate,
    startTime,
    status: { $nin: ["cancelled", "rejected", "no_show"] },
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  });

  return !conflict;
}

const receptionistManagedStatuses = [
  "checked_in",
  "no_show",
  "in_treatment",
  "completed",
  "cancelled",
] as const;

export async function GET(request: Request) {
  const guard = await authGuard();
  if (isGuardError(guard)) return guard.response;

  await connectMongo();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const query: Record<string, unknown> = {};

  if (status) query.status = status;

  if (guard.session.role === "patient") {
    query.patient = guard.session.userId;
  }

  if (guard.session.role === "dentist") {
    query.dentist = guard.session.userId;
  }

  if (guard.session.role === "nurse") {
    query.$or = [
      { nurse: guard.session.userId },
      { status: { $in: ["checked_in", "in_treatment"] } },
    ];
  }

  const appointments = await Appointment.find(query)
    .populate("patient")
    .populate("dentist")
    .populate("nurse")
    .populate("service")
    .sort({ appointmentDate: 1, startTime: 1, createdAt: -1 });

  return ok({ appointments: toJson(appointments) });
}

export async function POST(request: Request) {
  const guard = await authGuard(["patient", "receptionist", "admin"]);
  if (isGuardError(guard)) return guard.response;

  try {
    const body = createAppointmentSchema.parse(await request.json());
    await connectMongo();

    const service = await DentalService.findById(body.service);
    if (!service || !service.active) {
      return fail("Dịch vụ không khả dụng.", 404);
    }

    const appointmentDate = normalizeDateOnly(body.appointmentDate);
    const patient = guard.session.role === "patient" ? guard.session.userId : body.patient;
    if (!patient) return fail("Thiếu bệnh nhân cho lịch hẹn.", 400);

    const slotAvailable = await assertSlotAvailable(
      body.dentist,
      appointmentDate,
      body.startTime,
    );
    if (!slotAvailable) {
      return fail("Slot này đã có lịch hẹn khác.", 409);
    }

    const appointment = await Appointment.create({
      patient,
      dentist: body.dentist,
      nurse: body.nurse || undefined,
      service: body.service,
      appointmentDate,
      startTime: body.startTime,
      endTime: addMinutes(body.startTime, service.durationMinutes || 30),
      status: "pending",
      price: service.price,
      symptoms: body.symptoms,
      notes: body.notes,
      createdBy: guard.session.userId,
    });

    await writeAudit(guard.session, "appointment.create", "Appointment", String(appointment._id), {
      startTime: appointment.startTime,
    });
    const populated = await appointment.populate(["patient", "dentist", "nurse", "service"]);
    return ok({ appointment: toJson(populated) }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail("Dữ liệu đặt lịch chưa hợp lệ.", 422, error.flatten());
    }
    return fail("Không thể tạo lịch hẹn.", 500);
  }
}

export async function PATCH(request: Request) {
  const guard = await authGuard();
  if (isGuardError(guard)) return guard.response;

  try {
    const body = patchAppointmentSchema.parse(await request.json());
    if (!roleCanPatch(guard.session.role, body.action)) {
      return fail("Vai trò hiện tại không được thực hiện thao tác này.", 403);
    }

    await connectMongo();
    const appointment = await Appointment.findById(body._id);
    if (!appointment) return fail("Không tìm thấy lịch hẹn.", 404);

    const isOwner = String(appointment.patient) === guard.session.userId;
    const isAssignedDentist = String(appointment.dentist) === guard.session.userId;
    const isAssignedNurse = String(appointment.nurse || "") === guard.session.userId;

    if (guard.session.role === "patient" && !isOwner) {
      return fail("Bệnh nhân chỉ được thao tác lịch của chính mình.", 403);
    }
    if (guard.session.role === "dentist" && !isAssignedDentist) {
      return fail("Nha sĩ chỉ được thao tác lịch được phân công.", 403);
    }
    if (guard.session.role === "nurse" && appointment.nurse && !isAssignedNurse) {
      return fail("Y tá chỉ được thao tác lịch được phân công.", 403);
    }

    switch (body.action) {
      case "confirm":
        appointment.status = "confirmed";
        appointment.confirmedBy = guard.session.userId;
        break;
      case "reject":
        appointment.status = "rejected";
        appointment.cancellationReason = body.reason;
        break;
      case "checkIn":
        appointment.status = "checked_in";
        appointment.checkInAt = new Date();
        break;
      case "startTreatment":
        appointment.status = "in_treatment";
        break;
      case "complete":
        appointment.status = "completed";
        appointment.completedAt = new Date();
        break;
      case "cancel":
        if (
          guard.session.role !== "admin" &&
          !canChangeBefore24Hours(appointment.appointmentDate, appointment.startTime)
        ) {
          return fail("Chỉ được hủy lịch trước giờ hẹn ít nhất 24 giờ.", 409);
        }
        appointment.status = "cancelled";
        appointment.cancellationReason = body.reason;
        appointment.cancellationActorRole = guard.session.role;
        break;
      case "reschedule": {
        if (!body.appointmentDate || !body.startTime) {
          return fail("Thiếu ngày hoặc giờ mới.", 400);
        }
        if (
          guard.session.role !== "admin" &&
          !canChangeBefore24Hours(appointment.appointmentDate, appointment.startTime)
        ) {
          return fail("Chỉ được dời lịch trước giờ hẹn ít nhất 24 giờ.", 409);
        }
        const newDate = normalizeDateOnly(body.appointmentDate);
        const available = await assertSlotAvailable(
          String(appointment.dentist),
          newDate,
          body.startTime,
          body._id,
        );
        if (!available) return fail("Slot mới đã có lịch hẹn khác.", 409);
        appointment.rescheduledFrom = {
          appointmentDate: appointment.appointmentDate,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
        };
        appointment.appointmentDate = newDate;
        appointment.startTime = body.startTime;
        appointment.endTime = addMinutes(body.startTime, 30);
        appointment.status = "pending";
        break;
      }
      case "noShow":
        appointment.status = "no_show";
        appointment.noShowAt = new Date();
        appointment.noShowReason = body.reason;
        break;
      case "assignNurse":
        appointment.nurse = body.nurse || undefined;
        break;
      case "setStatus":
        if (!body.status) return fail("Thiếu trạng thái mới.", 400);
        if (!receptionistManagedStatuses.includes(body.status as (typeof receptionistManagedStatuses)[number])) {
          return fail("Lễ tân chỉ được đổi sang trạng thái có mặt, vắng mặt, đang khám, hoàn tất hoặc đã hủy.", 400);
        }
        if (
          guard.session.role === "receptionist" &&
          appointment.status === "cancelled" &&
          appointment.cancellationActorRole === "patient"
        ) {
          return fail("Bệnh nhân đã hủy lịch nên lễ tân không được đổi trạng thái nữa.", 409);
        }
        appointment.status = body.status;
        if (body.status === "checked_in") appointment.checkInAt = appointment.checkInAt || new Date();
        if (body.status === "no_show") {
          appointment.noShowAt = appointment.noShowAt || new Date();
          appointment.noShowReason = body.reason || appointment.noShowReason;
        }
        if (body.status === "completed") appointment.completedAt = appointment.completedAt || new Date();
        if (body.status === "cancelled") {
          appointment.cancellationReason = body.reason || appointment.cancellationReason;
          appointment.cancellationActorRole = guard.session.role;
        } else if (appointment.cancellationActorRole !== "patient") {
          appointment.cancellationReason = undefined;
          appointment.cancellationActorRole = undefined;
        }
        break;
      case "review":
        if (guard.session.role !== "patient") {
          return fail("Chỉ bệnh nhân mới được đánh giá lịch khám.", 403);
        }
        if (appointment.status !== "completed") {
          return fail("Chỉ được đánh giá sau khi ca khám hoàn tất.", 409);
        }
        if (!body.rating) return fail("Thiếu số sao đánh giá.", 400);
        appointment.patientRating = body.rating;
        appointment.patientReview = body.review;
        appointment.reviewedAt = new Date();
        break;
      case "note":
        appointment.notes = body.notes;
        break;
      default:
        return fail("Thao tác không được hỗ trợ.", 400);
    }

    await appointment.save();
    await writeAudit(guard.session, `appointment.${body.action}`, "Appointment", body._id);
    const populated = await appointment.populate(["patient", "dentist", "nurse", "service"]);
    return ok({ appointment: toJson(populated) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail("Dữ liệu cập nhật lịch chưa hợp lệ.", 422, error.flatten());
    }
    return fail("Không thể cập nhật lịch hẹn.", 500);
  }
}
