import { z } from "zod";
import { authGuard, fail, isGuardError, ok, toJson } from "@/lib/api";
import { writeAudit } from "@/lib/audit";
import { connectMongo } from "@/lib/mongodb";
import { useCases } from "@/lib/use-cases";
import { ClinicInfo } from "@/models/ClinicInfo";
import { DentalService } from "@/models/DentalService";
import { User } from "@/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const clinicSchema = z.object({
  name: z.string().min(2),
  slogan: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  openingHours: z.string().optional().or(z.literal("")),
  coverImageUrl: z.string().url().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export async function GET() {
  await connectMongo();
  const [clinic, services, dentists] = await Promise.all([
    ClinicInfo.findOne({}).sort({ updatedAt: -1 }),
    DentalService.find({ active: true }).sort({ category: 1, name: 1 }),
    User.find({ role: "dentist", active: true }).sort({ fullName: 1 }),
  ]);

  return ok({
    clinic: toJson(
      clinic ?? {
        name: "DAS Dental Clinic",
        slogan: "Nụ cười khỏe, lịch hẹn gọn.",
        openingHours: "Thứ 2 - Chủ nhật, 08:00 - 20:00",
      },
    ),
    services: toJson(services),
    dentists: toJson(dentists).map((dentist: Record<string, unknown>) => {
      delete dentist.passwordHash;
      return dentist;
    }),
    useCases,
  });
}

export async function PATCH(request: Request) {
  const guard = await authGuard(["admin"]);
  if (isGuardError(guard)) return guard.response;

  try {
    const body = clinicSchema.parse(await request.json());
    await connectMongo();
    const clinic = await ClinicInfo.findOneAndUpdate({}, body, {
      new: true,
      upsert: true,
      runValidators: true,
    });
    await writeAudit(guard.session, "clinic.update", "ClinicInfo", String(clinic._id));
    return ok({ clinic: toJson(clinic) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail("Dữ liệu phòng khám chưa hợp lệ.", 422, error.flatten());
    }
    return fail("Không thể cập nhật thông tin phòng khám.", 500);
  }
}
