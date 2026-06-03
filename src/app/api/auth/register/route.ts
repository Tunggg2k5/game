import { NextResponse } from "next/server";
import { z } from "zod";
import { connectMongo } from "@/lib/mongodb";
import { createSessionToken, hashPassword, setSessionCookie } from "@/lib/auth";
import { fail, ok, toJson } from "@/lib/api";
import { User } from "@/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const registerSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8).optional().or(z.literal("")),
  password: z.string().min(6),
});

function sanitizeUser(user: unknown) {
  const clean = toJson(user) as Record<string, unknown>;
  delete clean.passwordHash;
  return clean;
}

export async function POST(request: Request) {
  try {
    const body = registerSchema.parse(await request.json());
    await connectMongo();

    const existing = await User.findOne({ email: body.email.toLowerCase() });
    if (existing) {
      return fail("Email này đã được đăng ký.", 409);
    }

    const user = await User.create({
      fullName: body.fullName,
      email: body.email.toLowerCase(),
      phone: body.phone,
      passwordHash: await hashPassword(body.password),
      role: "patient",
      active: true,
    });

    const token = await createSessionToken({
      userId: String(user._id),
      role: user.role,
      email: user.email,
      fullName: user.fullName,
    });
    const response = ok({ user: sanitizeUser(user) }, 201) as NextResponse;
    setSessionCookie(response, token);
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail("Thông tin đăng ký chưa hợp lệ.", 422, error.flatten());
    }
    return fail("Không thể đăng ký tài khoản.", 500);
  }
}
