import { z } from "zod";
import { authGuard, fail, isGuardError, ok, toJson } from "@/lib/api";
import { writeAudit } from "@/lib/audit";
import { connectMongo } from "@/lib/mongodb";
import { Appointment } from "@/models/Appointment";
import { TreatmentRecord } from "@/models/TreatmentRecord";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const treatmentSchema = z.object({
  appointment: z.string().min(1),
  diagnosis: z.string().optional().or(z.literal("")),
  procedures: z.string().optional().or(z.literal("")),
  prescription: z.string().optional().or(z.literal("")),
  dentistNotes: z.string().optional().or(z.literal("")),
  nurseNotes: z.string().optional().or(z.literal("")),
  careInstructions: z.string().optional().or(z.literal("")),
  nextVisitDate: z.string().optional().or(z.literal("")),
});

export async function GET() {
  const guard = await authGuard(["admin", "dentist", "nurse", "patient", "receptionist"]);
  if (isGuardError(guard)) return guard.response;

  await connectMongo();
  const query: Record<string, unknown> = {};
  if (guard.session.role === "patient") query.patient = guard.session.userId;
  if (guard.session.role === "dentist") query.dentist = guard.session.userId;
  if (guard.session.role === "nurse") query.nurse = guard.session.userId;

  const treatments = await TreatmentRecord.find(query)
    .populate("appointment")
    .populate("patient")
    .populate("dentist")
    .populate("nurse")
    .sort({ createdAt: -1 });

  return ok({ treatments: toJson(treatments) });
}

export async function POST(request: Request) {
  const guard = await authGuard(["admin", "dentist", "nurse"]);
  if (isGuardError(guard)) return guard.response;

  try {
    const body = treatmentSchema.parse(await request.json());
    await connectMongo();
    const appointment = await Appointment.findById(body.appointment);
    if (!appointment) return fail("Không tìm thấy lịch hẹn.", 404);

    if (guard.session.role === "dentist" && String(appointment.dentist) !== guard.session.userId) {
      return fail("Nha sĩ chỉ được ghi hồ sơ của lịch được phân công.", 403);
    }
    if (
      guard.session.role === "nurse" &&
      appointment.nurse &&
      String(appointment.nurse) !== guard.session.userId
    ) {
      return fail("Y tá chỉ được ghi chú lịch được phân công.", 403);
    }

    const update = {
      appointment: appointment._id,
      patient: appointment.patient,
      dentist: appointment.dentist,
      nurse: appointment.nurse || undefined,
      diagnosis: body.diagnosis,
      procedures: body.procedures,
      prescription: body.prescription,
      dentistNotes: body.dentistNotes,
      nurseNotes: body.nurseNotes,
      careInstructions: body.careInstructions,
      nextVisitDate: body.nextVisitDate ? new Date(body.nextVisitDate) : undefined,
    };

    const treatment = await TreatmentRecord.findOneAndUpdate(
      { appointment: appointment._id },
      update,
      { new: true, upsert: true, runValidators: true },
    )
      .populate("appointment")
      .populate("patient")
      .populate("dentist")
      .populate("nurse");

    if (body.diagnosis || body.procedures) {
      appointment.status = "completed";
      appointment.completedAt = appointment.completedAt || new Date();
      await appointment.save();
    }

    await writeAudit(guard.session, "treatment.upsert", "TreatmentRecord", String(treatment._id));
    return ok({ treatment: toJson(treatment) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail("Dữ liệu điều trị chưa hợp lệ.", 422, error.flatten());
    }
    return fail("Không thể lưu hồ sơ điều trị.", 500);
  }
}
