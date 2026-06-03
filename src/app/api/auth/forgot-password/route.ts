import { z } from "zod";
import { fail, ok } from "@/lib/api";
import { connectMongo } from "@/lib/mongodb";
import { User } from "@/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    await connectMongo();
    const user = await User.findOne({ email: body.email.toLowerCase(), active: true });

    return ok({
      ok: true,
      message: user
        ? "Đã ghi nhận yêu cầu reset mật khẩu. Tích hợp email SMTP có thể thêm ở bước deploy."
        : "Nếu email tồn tại trong hệ thống, hướng dẫn reset sẽ được gửi.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail("Email chưa hợp lệ.", 422, error.flatten());
    }
    return fail("Không thể xử lý yêu cầu reset mật khẩu.", 500);
  }
}
