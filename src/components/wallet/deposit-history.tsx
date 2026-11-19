import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { assetLabel } from "@/lib/assets";
import { formatDate } from "@/lib/utils";
import type { BalanceTransaction } from "@/lib/types";

type HistoryTone = "amber" | "green" | "red" | "neutral";

function depositStatus(tx: BalanceTransaction): {
  label: string;
  detail: string;
  tone: HistoryTone;
} {
  if (tx.type === "admin_adjustment") {
    return {
      label: "Adjusted",
      detail: "Balance updated by an escrow officer.",
      tone: "neutral",
    };
  }

  switch (tx.status) {
    case "pending":
      return {
        label: "Sent on-chain · pending review",
        detail: "Waiting for an officer to confirm the deposit.",
        tone: "amber",
      };
    case "approved":
      return {
        label: "Confirmed on-chain",
        detail: "Deposit verified and credited to your balance.",
        tone: "green",
      };
    case "rejected":
      return {
        label: "Not confirmed",
        detail: "Officer could not verify this deposit.",
        tone: "red",
      };
    default:
      return {
        label: tx.status.replaceAll("_", " "),
        detail: "",
        tone: "neutral",
      };
  }
}

export function DepositHistory({
  history,
}: {
  history: (BalanceTransaction & { tx_hash?: string | null })[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Deposit history</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {history.map((tx) => {
          const status = depositStatus(tx);
          return (
            <div
              key={tx.id}
              className="flex flex-col gap-2 rounded-lg border border-border-soft px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium text-navy">
                  {assetLabel(tx.asset)} · {tx.amount}
                </div>
                <div className="mt-0.5 text-xs text-gray-400">{formatDate(tx.created_at)}</div>
                {tx.tx_hash && (
                  <div className="mt-1 truncate font-mono text-[11px] text-gray-500" title={tx.tx_hash}>
                    Tx · {tx.tx_hash}
                  </div>
                )}
                {status.detail && <div className="mt-1 text-xs text-gray-500">{status.detail}</div>}
              </div>
              <Badge tone={status.tone}>{status.label}</Badge>
            </div>
          );
        })}
        {history.length === 0 && (
          <p className="text-sm text-gray-400">No deposits yet. Send crypto to the address above, then submit for confirmation.</p>
        )}
      </CardContent>
    </Card>
  );
}
