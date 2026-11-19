import { addDoc, nowIso } from "@/lib/firebase/db";

export async function logAdminAction(params: {
  actorId: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  reason?: string | null;
}) {
  await addDoc("auditLogs", {
    actor_id: params.actorId,
    actor_role: params.actorRole,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId ?? null,
    old_value: params.oldValue ?? null,
    new_value: params.newValue ?? null,
    reason: params.reason ?? null,
    created_at: nowIso(),
  });
}

export async function addTimelineEvent(params: {
  contractId: string;
  actorId: string | null;
  eventType: string;
  description: string;
}) {
  await addDoc("timeline", {
    contract_id: params.contractId,
    actor_id: params.actorId,
    event_type: params.eventType,
    description: params.description,
    created_at: nowIso(),
  });
}
