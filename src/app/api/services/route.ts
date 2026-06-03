import { z } from "zod";
import { authGuard, fail, isGuardError, ok, toJson } from "@/lib/api";
import { writeAudit } from "@/lib/audit";
import { connectMongo } from "@/lib/mongodb";
import { DentalService } from "@/models/DentalService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const serviceSchema = z.object({
  name: z.string().min(2),
  category: z.string().min(2),
  description: z.string().optional().or(z.literal("")),
  durationMinutes: z.coerce.number().min(15).max(240),
  price: z.coerce.number().min(0),
  active: z.boolean().optional(),
});

const updateSchema = serviceSchema.partial().extend({
  _id: z.string().min(1),
});

export async function GET() {
  await connectMongo();
  const services = await DentalService.find({}).sort({ active: -1, category: 1, name: 1 });
  return ok({ services: toJson(services) });
}

export async function POST(request: Request) {
  const guard = await authGuard(["admin"]);
  if (isGuardError(guard)) return guard.response;

  try {
    const body = serviceSchema.parse(await request.json());
    await connectMongo();
    const service = await DentalService.create(body);
    await writeAudit(guard.session, "service.create", "DentalService", String(service._id), {
      name: service.name,
    });
    return ok({ service: toJson(service) }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail("Dữ liệu dịch vụ chưa hợp lệ.", 422, error.flatten());
    }
    return fail("Không thể tạo dịch vụ. Tên dịch vụ có thể đã tồn tại.", 500);
  }
}

export async function PATCH(request: Request) {
  const guard = await authGuard(["admin"]);
  if (isGuardError(guard)) return guard.response;

  try {
    const body = updateSchema.parse(await request.json());
    await connectMongo();
    const service = await DentalService.findByIdAndUpdate(body._id, body, {
      new: true,
      runValidators: true,
    });
    if (!service) return fail("Không tìm thấy dịch vụ.", 404);
    await writeAudit(guard.session, "service.update", "DentalService", String(service._id), {
      name: service.name,
    });
    return ok({ service: toJson(service) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail("Dữ liệu cập nhật chưa hợp lệ.", 422, error.flatten());
    }
    return fail("Không thể cập nhật dịch vụ.", 500);
  }
}

export async function DELETE(request: Request) {
  const guard = await authGuard(["admin"]);
  if (isGuardError(guard)) return guard.response;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return fail("Thiếu id dịch vụ.", 400);

  await connectMongo();
  const service = await DentalService.findByIdAndUpdate(
    id,
    { active: false },
    { new: true },
  );
  if (!service) return fail("Không tìm thấy dịch vụ.", 404);
  await writeAudit(guard.session, "service.deactivate", "DentalService", String(service._id));
  return ok({ service: toJson(service) });
}
