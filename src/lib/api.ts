import { NextResponse } from "next/server";
import { readSession } from "@/lib/auth";
import type { Role, SessionPayload } from "@/lib/types";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ message, details }, { status });
}

export async function authGuard(allowedRoles?: Role[]) {
  const session = await readSession();

  if (!session) {
    return { response: fail("Bạn cần đăng nhập để thực hiện thao tác này.", 401) };
  }

  if (allowedRoles && !allowedRoles.includes(session.role)) {
    return { response: fail("Tài khoản không có quyền truy cập chức năng này.", 403) };
  }

  return { session };
}

export function isGuardError(
  result:
    | { response: NextResponse }
    | {
        session: SessionPayload;
      },
): result is { response: NextResponse } {
  return "response" in result;
}

export function toJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function normalizeDateOnly(value: string | Date) {
  const date = typeof value === "string" ? new Date(`${value}T00:00:00.000Z`) : value;
  if (Number.isNaN(date.getTime())) {
    throw new Error("Ngày không hợp lệ.");
  }
  return date;
}

export function canChangeBefore24Hours(date: Date, startTime: string) {
  const [hours, minutes] = startTime.split(":").map(Number);
  const appointmentAt = new Date(date);
  appointmentAt.setUTCHours(hours || 0, minutes || 0, 0, 0);
  const hoursUntil = (appointmentAt.getTime() - Date.now()) / (1000 * 60 * 60);
  return hoursUntil >= 24;
}
