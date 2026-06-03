import { z } from "zod";
import { authGuard, fail, isGuardError, ok, toJson } from "@/lib/api";
import { writeAudit } from "@/lib/audit";
import { connectMongo } from "@/lib/mongodb";
import { InventoryItem } from "@/models/InventoryItem";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const inventorySchema = z.object({
  _id: z.string().optional(),
  name: z.string().min(2),
  category: z.string().min(2),
  stock: z.coerce.number().min(0),
  unit: z.string().min(1),
  reorderLevel: z.coerce.number().min(0),
  notes: z.string().optional().or(z.literal("")),
  active: z.boolean().optional(),
});

export async function GET() {
  const guard = await authGuard(["admin", "nurse", "receptionist"]);
  if (isGuardError(guard)) return guard.response;

  await connectMongo();
  const items = await InventoryItem.find({}).sort({ category: 1, name: 1 });
  return ok({ items: toJson(items) });
}

export async function POST(request: Request) {
  const guard = await authGuard(["admin", "nurse"]);
  if (isGuardError(guard)) return guard.response;

  try {
    const body = inventorySchema.parse(await request.json());
    await connectMongo();
    const payload = {
      ...body,
      lastRequestedBy: guard.session.userId,
    };
    const item = body._id
      ? await InventoryItem.findByIdAndUpdate(body._id, payload, {
          new: true,
          runValidators: true,
        })
      : await InventoryItem.create(payload);

    if (!item) return fail("Không tìm thấy vật tư.", 404);
    await writeAudit(guard.session, body._id ? "inventory.update" : "inventory.create", "InventoryItem", String(item._id));
    return ok({ item: toJson(item) }, body._id ? 200 : 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail("Dữ liệu tồn kho chưa hợp lệ.", 422, error.flatten());
    }
    return fail("Không thể lưu vật tư.", 500);
  }
}
