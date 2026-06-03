import { z } from "zod";
import { authGuard, fail, isGuardError, ok, toJson } from "@/lib/api";
import { hashPassword } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { connectMongo } from "@/lib/mongodb";
import { roles } from "@/lib/types";
import { User } from "@/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createUserSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional().or(z.literal("")),
  password: z.string().min(6).optional(),
  role: z.enum(roles),
  avatarUrl: z.string().url().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  specialty: z.string().optional().or(z.literal("")),
  experienceYears: z.coerce.number().min(0).optional(),
  licenseNo: z.string().optional().or(z.literal("")),
  bio: z.string().optional().or(z.literal("")),
  active: z.boolean().optional(),
});

const updateUserSchema = createUserSchema.partial().extend({
  _id: z.string().min(1),
  password: z.string().min(6).optional().or(z.literal("")),
});

function sanitize(user: unknown) {
  const clean = toJson(user) as Record<string, unknown>;
  delete clean.passwordHash;
  return clean;
}

export async function GET(request: Request) {
  const guard = await authGuard(["admin", "receptionist", "dentist", "nurse"]);
  if (isGuardError(guard)) return guard.response;

  await connectMongo();
  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role");
  const query: Record<string, unknown> = {};
  if (role && roles.includes(role as (typeof roles)[number])) {
    query.role = role;
  }

  const users = await User.find(query).sort({ role: 1, fullName: 1 });
  return ok({ users: sanitize(users) });
}

export async function POST(request: Request) {
  const guard = await authGuard(["admin"]);
  if (isGuardError(guard)) return guard.response;

  try {
    const body = createUserSchema.parse(await request.json());
    await connectMongo();
    const user = await User.create({
      ...body,
      email: body.email.toLowerCase(),
      passwordHash: await hashPassword(body.password || "123456"),
    });
    await writeAudit(guard.session, "user.create", "User", String(user._id), {
      role: user.role,
    });
    return ok({ user: sanitize(user) }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail("Dữ liệu nhân sự chưa hợp lệ.", 422, error.flatten());
    }
    return fail("Không thể tạo tài khoản. Email có thể đã tồn tại.", 500);
  }
}

export async function PATCH(request: Request) {
  const guard = await authGuard();
  if (isGuardError(guard)) return guard.response;

  try {
    const body = updateUserSchema.parse(await request.json());
    const isSelf = body._id === guard.session.userId;
    const isAdmin = guard.session.role === "admin";
    if (!isSelf && !isAdmin) {
      return fail("Bạn chỉ có thể cập nhật hồ sơ của mình.", 403);
    }

    const update: Record<string, unknown> = { ...body };
    delete update._id;
    delete update.password;

    if (!isAdmin) {
      delete update.role;
      delete update.active;
      delete update.specialty;
      delete update.experienceYears;
      delete update.licenseNo;
    }

    if (body.password) {
      update.passwordHash = await hashPassword(body.password);
    }

    await connectMongo();
    const user = await User.findByIdAndUpdate(body._id, update, {
      new: true,
      runValidators: true,
    });
    if (!user) return fail("Không tìm thấy tài khoản.", 404);
    await writeAudit(guard.session, "user.update", "User", String(user._id), {
      self: isSelf,
    });
    return ok({ user: sanitize(user) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail("Dữ liệu cập nhật hồ sơ chưa hợp lệ.", 422, error.flatten());
    }
    return fail("Không thể cập nhật hồ sơ.", 500);
  }
}
