import { connectMongo } from "@/lib/mongodb";
import { fail, ok, toJson } from "@/lib/api";
import { readSession } from "@/lib/auth";
import { User } from "@/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sanitizeUser(user: unknown) {
  const clean = toJson(user) as Record<string, unknown>;
  delete clean.passwordHash;
  return clean;
}

export async function GET() {
  const session = await readSession();
  if (!session) {
    return ok({ user: null });
  }

  await connectMongo();
  const user = await User.findById(session.userId);
  if (!user || !user.active) {
    return fail("Phiên đăng nhập không còn hợp lệ.", 401);
  }

  return ok({ user: sanitizeUser(user) });
}
