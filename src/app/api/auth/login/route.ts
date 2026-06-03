import { NextResponse } from "next/server";
import { z } from "zod";
import { connectMongo } from "@/lib/mongodb";
import { createSessionToken, setSessionCookie, verifyPassword } from "@/lib/auth";
import { fail, ok, toJson } from "@/lib/api";
import { User } from "@/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function sanitizeUser(user: unknown) {
  const clean = toJson(user) as Record<string, unknown>;
  delete clean.passwordHash;
  return clean;
}

export async function POST(request: Request) {
  try {
    const body = loginSchema.parse(await request.json());
    await connectMongo();

    const user = await User.findOne({ email: body.email.toLowerCase(), active: true });
    if (!user) {
      return fail("Email hoặc mật khẩu không đúng.", 401);
    }

    const valid = await verifyPassword(body.password, user.passwordHash);
    if (!valid) {
      return fail("Email hoặc mật khẩu không đúng.", 401);
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = await createSessionToken({
      userId: String(user._id),
      role: user.role,
      email: user.email,
      fullName: user.fullName,
    });
    const response = ok({ user: sanitizeUser(user) }) as NextResponse;
    setSessionCookie(response, token);
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail("Thông tin đăng nhập chưa hợp lệ.", 422, error.flatten());
    }
    return fail("Không thể đăng nhập.", 500);
  }
}
