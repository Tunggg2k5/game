import { AuditLog } from "@/models/AuditLog";
import type { SessionPayload } from "@/lib/types";

export async function writeAudit(
  session: SessionPayload | null,
  action: string,
  entity: string,
  entityId?: string,
  metadata?: Record<string, unknown>,
) {
  try {
    await AuditLog.create({
      actor: session?.userId,
      actorRole: session?.role,
      action,
      entity,
      entityId,
      metadata,
    });
  } catch (error) {
    console.error("Failed to write audit log", error);
  }
}
