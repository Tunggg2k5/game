import { z } from "zod";
import { authGuard, fail, isGuardError, ok, toJson } from "@/lib/api";
import { writeAudit } from "@/lib/audit";
import { connectMongo } from "@/lib/mongodb";
import { NurseTask } from "@/models/NurseTask";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const taskSchema = z.object({
  _id: z.string().optional(),
  nurse: z.string().optional(),
  appointment: z.string().optional().or(z.literal("")),
  title: z.string().min(2),
  checklist: z.array(z.string()).optional(),
  status: z.enum(["todo", "doing", "done"]).optional(),
  dueAt: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export async function GET() {
  const guard = await authGuard(["admin", "nurse", "receptionist"]);
  if (isGuardError(guard)) return guard.response;

  await connectMongo();
  const query: Record<string, unknown> = {};
  if (guard.session.role === "nurse") query.nurse = guard.session.userId;

  const tasks = await NurseTask.find(query)
    .populate("nurse")
    .populate("appointment")
    .sort({ status: 1, dueAt: 1, createdAt: -1 });
  return ok({ tasks: toJson(tasks) });
}

export async function POST(request: Request) {
  const guard = await authGuard(["admin", "nurse", "receptionist"]);
  if (isGuardError(guard)) return guard.response;

  try {
    const body = taskSchema.parse(await request.json());
    const nurse = guard.session.role === "nurse" ? guard.session.userId : body.nurse;
    if (!nurse) return fail("Thiếu y tá phụ trách.", 400);

    await connectMongo();
    const payload = {
      nurse,
      appointment: body.appointment || undefined,
      title: body.title,
      checklist: body.checklist || [],
      status: body.status || "todo",
      dueAt: body.dueAt ? new Date(body.dueAt) : undefined,
      notes: body.notes,
    };

    const task = body._id
      ? await NurseTask.findByIdAndUpdate(body._id, payload, {
          new: true,
          runValidators: true,
        })
      : await NurseTask.create(payload);

    if (!task) return fail("Không tìm thấy công việc y tá.", 404);
    await writeAudit(guard.session, body._id ? "nurseTask.update" : "nurseTask.create", "NurseTask", String(task._id));
    const populated = await task.populate(["nurse", "appointment"]);
    return ok({ task: toJson(populated) }, body._id ? 200 : 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail("Dữ liệu công việc y tá chưa hợp lệ.", 422, error.flatten());
    }
    return fail("Không thể lưu công việc y tá.", 500);
  }
}
