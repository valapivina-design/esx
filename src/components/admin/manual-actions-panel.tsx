import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AdminActionButton } from "@/components/admin/action-button";
import { performContractActionAction } from "@/lib/data/admin-actions";
import type { AdminActionType, ContractStatus, PaymentStatus } from "@/lib/types";

type ActionDef = {
  action: AdminActionType;
  label: string;
  variant?: "outline" | "success" | "danger" | "primary";
};

const FUND_ACTIONS: ActionDef[] = [
  { action: "release_funds", label: "Release Funds", variant: "success" },
  { action: "refund_funds", label: "Refund Funds", variant: "danger" },
];

const STATUS_ACTIONS: ActionDef[] = [
  { action: "mark_deposit_confirmed", label: "Mark Deposit Confirmed" },
  { action: "mark_pending", label: "Mark Pending" },
  { action: "mark_paid", label: "Mark Paid" },
  { action: "mark_unpaid", label: "Mark Unpaid" },
  { action: "mark_payment_failed", label: "Mark Payment Failed", variant: "danger" },
  { action: "mark_complete", label: "Mark Complete", variant: "success" },
  { action: "mark_incomplete", label: "Mark Incomplete" },
];

const CONTROL_ACTIONS: ActionDef[] = [
  { action: "pause_contract", label: "Pause" },
  { action: "cancel_contract", label: "Cancel", variant: "danger" },
  { action: "lock_contract", label: "Lock" },
  { action: "unlock_contract", label: "Unlock" },
];

function recommendedActions(
  status: ContractStatus,
  paymentStatus: PaymentStatus
): ActionDef[] {
  if (["release_requested", "admin_reviewing_release", "delivery_completed"].includes(status)) {
    return [
      { action: "release_funds", label: "Release Funds", variant: "success" },
      { action: "refund_funds", label: "Refund", variant: "danger" },
    ];
  }
  if (["deposit_confirmed", "admin_reviewing", "active_escrow", "awaiting_delivery"].includes(status)) {
    return [
      { action: "release_funds", label: "Release Funds", variant: "success" },
      { action: "mark_paid", label: "Mark Paid", variant: "primary" },
    ];
  }
  if (["released"].includes(status)) {
    return [{ action: "mark_complete", label: "Mark Complete", variant: "success" }];
  }
  if (
    ["deposit_pending", "blockchain_confirming", "waiting_for_deposit"].includes(status) ||
    (paymentStatus === "pending" &&
      !["deposit_confirmed", "admin_reviewing", "active_escrow", "awaiting_delivery", "delivery_completed", "release_requested", "admin_reviewing_release", "released", "completed"].includes(
        status
      ))
  ) {
    return [
      { action: "mark_deposit_confirmed", label: "Confirm Deposit", variant: "primary" },
      { action: "mark_payment_failed", label: "Payment Failed", variant: "danger" },
    ];
  }
  return FUND_ACTIONS;
}

export function ManualActionsPanel({
  contractId,
  status,
  paymentStatus,
}: {
  contractId: string;
  status: ContractStatus;
  paymentStatus: PaymentStatus;
}) {
  const primary = recommendedActions(status, paymentStatus);
  const primaryKeys = new Set(primary.map((a) => a.action));

  return (
    <Card elevated>
      <CardHeader className="bg-navy-900 text-white">
        <CardTitle className="text-white">Control center</CardTitle>
        <p className="mt-1 text-xs font-normal text-white/60">
          Manage this escrow without opening the database. Every action needs a reason and is audited.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
            Recommended
          </div>
          <div className="grid gap-2">
            {primary.map((a) => (
              <AdminActionButton
                key={a.action}
                label={a.label}
                variant={a.variant === "primary" ? "primary" : a.variant}
                action={performContractActionAction.bind(null, contractId, a.action)}
              />
            ))}
          </div>
        </div>

        <details className="group rounded-lg border border-border-soft">
          <summary className="cursor-pointer list-none px-3 py-2.5 text-sm font-medium text-gray-700 marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="flex items-center justify-between">
              More actions
              <span className="text-xs text-gray-400 group-open:hidden">Show</span>
              <span className="hidden text-xs text-gray-400 group-open:inline">Hide</span>
            </span>
          </summary>
          <div className="space-y-4 border-t border-border-soft px-3 py-3">
            <ActionGroup
              title="Funds"
              actions={FUND_ACTIONS.filter((a) => !primaryKeys.has(a.action))}
              contractId={contractId}
            />
            <ActionGroup
              title="Status"
              actions={STATUS_ACTIONS.filter((a) => !primaryKeys.has(a.action))}
              contractId={contractId}
            />
            <ActionGroup title="Contract" actions={CONTROL_ACTIONS} contractId={contractId} />
          </div>
        </details>
      </CardContent>
    </Card>
  );
}

function ActionGroup({
  title,
  actions,
  contractId,
}: {
  title: string;
  actions: ActionDef[];
  contractId: string;
}) {
  if (actions.length === 0) return null;
  return (
    <div>
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">{title}</div>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((a) => (
          <AdminActionButton
            key={a.action}
            label={a.label}
            variant={a.variant === "primary" ? "outline" : a.variant}
            action={performContractActionAction.bind(null, contractId, a.action)}
          />
        ))}
      </div>
    </div>
  );
}
