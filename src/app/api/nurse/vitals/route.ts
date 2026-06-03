import { z } from "zod";
import { authGuard, fail, isGuardError, ok, toJson } from "@/lib/api";
import { writeAudit } from "@/lib/audit";
import { connectMongo } from "@/lib/mongodb";
import { Appointment } from "@/models/Appointment";
import { VitalSign } from "@/models/VitalSign";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const vitalSchema = z.object({
  appointment: z.string().min(1),
  bloodPressure: z.string().optional().or(z.literal("")),
  pulse: z.coerce.number().min(20).max(220).optional().or(z.literal("")),
  temperature: z.coerce.number().min(30).max(45).optional().or(z.literal("")),
  weight: z.coerce.number().min(1).max(300).optional().or(z.literal("")),
  allergies: z.string().optional().or(z.literal("")),
  chiefComplaint: z.string().optional().or(z.literal("")),
});

export async function GET() {
  const guard = await authGuard(["admin", "dentist", "nurse", "receptionist"]);
  if (isGuardError(guard)) return guard.response;

  await connectMongo();
  const query: Record<string, unknown> = {};
  if (guard.session.role === "nurse") query.nurse = guard.session.userId;

  const vitals = await VitalSign.find(query)
    .populate("appointment")
    .populate("patient")
    .populate("nurse")
    .sort({ createdAt: -1 });
  return ok({ vitals: toJson(vitals) });
}

export async function POST(request: Request) {
  const guard = await authGuard(["admin", "nurse"]);
  if (isGuardError(guard)) return guard.response;

  try {
    const body = vitalSchema.parse(await request.json());
    await connectMongo();
    const appointment = await Appointment.findById(body.appointment);
    if (!appointment) return fail("Không tìm thấy lịch hẹn.", 404);

    const nurse = guard.session.role === "nurse" ? guard.session.userId : appointment.nurse;
    if (!nurse) return fail("Lịch hẹn chưa được gán y tá.", 400);

    const vital = await VitalSign.findOneAndUpdate(
      { appointment: appointment._id },
      {
        appointment: appointment._id,
        patient: appointment.patient,
        nurse,
        bloodPressure: body.bloodPressure,
        pulse: body.pulse || undefined,
        temperature: body.temperature || undefined,
        weight: body.weight || undefined,
        allergies: body.allergies,
        chiefComplaint: body.chiefComplaint,
      },
      { new: true, upsert: true, runValidators: true },
    )
      .populate("appointment")
      .populate("patient")
      .populate("nurse");

    await writeAudit(guard.session, "vital.upsert", "VitalSign", String(vital._id));
    return ok({ vital: toJson(vital) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail("Dữ liệu sinh hiệu chưa hợp lệ.", 422, error.flatten());
    }
    return fail("Không thể lưu sinh hiệu.", 500);
  }
}
