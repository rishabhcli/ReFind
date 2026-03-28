/**
 * WorkOS Audit Log utilities for tracking agent actions.
 *
 * In production, this would call the WorkOS Audit Logs API:
 *   POST https://api.workos.com/audit-logs/events
 *
 * For the hackathon MVP, we log to the console and prepare the
 * event format so integration is plug-and-play.
 */

export type AuditAction =
  | "agent.search_started"
  | "agent.search_completed"
  | "agent.deal_scored"
  | "agent.contact_drafted"
  | "agent.contact_approved"
  | "agent.contact_declined"
  | "user.thread_created"
  | "user.thread_deleted";

export interface AuditEvent {
  action: AuditAction;
  actor: { type: "user"; id: string };
  targets: Array<{ type: string; id: string; name?: string }>;
  metadata?: Record<string, string | number | boolean>;
  occurred_at: string;
}

const WORKOS_API_KEY = process.env.WORKOS_API_KEY;
const WORKOS_ORG_ID = process.env.WORKOS_ORG_ID;

export async function emitAuditEvent(event: AuditEvent): Promise<void> {
  const payload = {
    organization_id: WORKOS_ORG_ID,
    event: {
      action: event.action,
      occurred_at: event.occurred_at,
      actor: event.actor,
      targets: event.targets,
      metadata: event.metadata,
    },
  };

  // Always log locally
  console.log("[AUDIT]", JSON.stringify(payload, null, 2));

  // Send to WorkOS if configured
  if (WORKOS_API_KEY && WORKOS_ORG_ID) {
    try {
      await fetch("https://api.workos.com/audit-logs/events", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${WORKOS_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error("[AUDIT] Failed to send to WorkOS:", err);
    }
  }
}

/** Convenience helpers */
export function auditSearchStarted(userId: string, query: string) {
  return emitAuditEvent({
    action: "agent.search_started",
    actor: { type: "user", id: userId },
    targets: [{ type: "query", id: query, name: query }],
    occurred_at: new Date().toISOString(),
  });
}

export function auditContactApproved(
  userId: string,
  listingId: string,
  sellerName: string,
) {
  return emitAuditEvent({
    action: "agent.contact_approved",
    actor: { type: "user", id: userId },
    targets: [
      { type: "listing", id: listingId },
      { type: "seller", id: sellerName, name: sellerName },
    ],
    occurred_at: new Date().toISOString(),
  });
}
