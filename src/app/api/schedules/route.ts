import { z } from "zod";
import { authGuard, fail, isGuardError, ok, toJson } from "@/lib/api";
import { writeAudit } from "@/lib/audit";
import { connectMongo } from "@/lib/mongodb";
import { WorkSchedule } from "@/models/WorkSchedule";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const scheduleSchema = z.object({
  dentist: z.string().optional(),
  weekday: z.coerce.number().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  slotMinutes: z.coerce.number().min(15).max(120).default(30),
  room: z.string().optional().or(z.literal("")),
  active: z.boolean().optional(),
});

const updateSchema = scheduleSchema.partial().extend({
  _id: z.string().min(1),
});

export async function GET(request: Request) {
  await connectMongo();
  const { searchParams } = new URL(request.url);
  const dentist = searchParams.get("dentist");
  const query: Record<string, unknown> = {};
  if (dentist) query.dentist = dentist;

  const schedules = await WorkSchedule.find(query)
    .populate("dentist")
    .sort({ weekday: 1, startTime: 1 });
  return ok({ schedules: toJson(schedules) });
}

export async function POST(request: Request) {
  const guard = await authGuard(["admin", "dentist"]);
  if (isGuardError(guard)) return guard.response;

  try {
    const body = scheduleSchema.parse(await request.json());
    const dentist = guard.session.role === "dentist" ? guard.session.userId : body.dentist;
    if (!dentist) return fail("Thiếu nha sĩ cho lịch làm việc.", 400);

    await connectMongo();
    const schedule = await WorkSchedule.create({ ...body, dentist });
    await writeAudit(guard.session, "schedule.create", "WorkSchedule", String(schedule._id));
    return ok({ schedule: toJson(schedule) }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail("Dữ liệu lịch làm việc chưa hợp lệ.", 422, error.flatten());
    }
    return fail("Không thể tạo lịch làm việc.", 500);
  }
}

export async function PATCH(request: Request) {
  const guard = await authGuard(["admin", "dentist"]);
  if (isGuardError(guard)) return guard.response;

  try {
    const body = updateSchema.parse(await request.json());
    await connectMongo();
    const current = await WorkSchedule.findById(body._id);
    if (!current) return fail("Không tìm thấy lịch làm việc.", 404);
    if (guard.session.role === "dentist" && String(current.dentist) !== guard.session.userId) {
      return fail("Nha sĩ chỉ được cập nhật lịch của chính mình.", 403);
    }

    const schedule = await WorkSchedule.findByIdAndUpdate(body._id, body, {
      new: true,
      runValidators: true,
    });
    await writeAudit(guard.session, "schedule.update", "WorkSchedule", body._id);
    return ok({ schedule: toJson(schedule) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail("Dữ liệu cập nhật lịch chưa hợp lệ.", 422, error.flatten());
    }
    return fail("Không thể cập nhật lịch làm việc.", 500);
  }
}

export async function DELETE(request: Request) {
  const guard = await authGuard(["admin", "dentist"]);
  if (isGuardError(guard)) return guard.response;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return fail("Thiếu id lịch làm việc.", 400);

  await connectMongo();
  const current = await WorkSchedule.findById(id);
  if (!current) return fail("Không tìm thấy lịch làm việc.", 404);
  if (guard.session.role === "dentist" && String(current.dentist) !== guard.session.userId) {
    return fail("Nha sĩ chỉ được xóa lịch của chính mình.", 403);
  }

  current.active = false;
  await current.save();
  await writeAudit(guard.session, "schedule.deactivate", "WorkSchedule", id);
  return ok({ schedule: toJson(current) });
}
