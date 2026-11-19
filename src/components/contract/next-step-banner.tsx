import Link from "next/link";
import type { ContractStatus, PaymentStatus } from "@/lib/types";

type Tone = "navy" | "amber" | "green" | "red";

const TONE: Record<Tone, string> = {
  navy: "border-navy/15 bg-navy/[0.04] text-navy",
  amber: "border-amber-200 bg-amber-50 text-amber-950",
  green: "border-emerald-200 bg-emerald-50 text-emerald-950",
  red: "border-red-200 bg-red-50 text-red-950",
};

export function NextStepBanner({
  title,
  body,
  tone = "navy",
  href,
  linkLabel,
}: {
  title: string;
  body: string;
  tone?: Tone;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className={`rounded-xl border px-5 py-4 ${TONE[tone]}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] opacity-70">Next step</p>
      <p className="mt-1 text-base font-semibold">{title}</p>
      <p className="mt-1 text-sm opacity-80">{body}</p>
      {href && linkLabel && (
        <Link href={href} className="mt-3 inline-block text-sm font-semibold underline underline-offset-2">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

export function adminNextStep(status: ContractStatus, paymentStatus: PaymentStatus): {
  title: string;
  body: string;
  tone: Tone;
} {
  if (["disputed", "under_mediation"].includes(status)) {
    return {
      title: "Dispute needs attention",
      body: "Open the mediation center, review both sides, and record a settlement or resolution.",
      tone: "red",
    };
  }
  if (["released", "completed", "closed"].includes(status)) {
    return {
      title: "Contract closed",
      body: "No further action needed. Audit log and notes remain available for records.",
      tone: "green",
    };
  }
  if (["release_requested", "admin_reviewing_release"].includes(status)) {
    return {
      title: "Review and release funds",
      body: "Buyer requested release. Confirm delivery terms are met, then Release Funds.",
      tone: "amber",
    };
  }
  if (["deposit_confirmed", "admin_reviewing", "active_escrow", "awaiting_delivery", "delivery_completed"].includes(status)) {
    return {
      title: "Escrow is funded — monitor the deal",
      body: "Watch chat and timeline. Release when both parties are ready, or refund if needed.",
      tone: "green",
    };
  }
  if (
    ["deposit_pending", "blockchain_confirming", "waiting_for_deposit"].includes(status) ||
    (paymentStatus === "pending" &&
      !["deposit_confirmed", "admin_reviewing", "active_escrow", "awaiting_delivery", "delivery_completed", "release_requested", "admin_reviewing_release", "released", "completed"].includes(
        status
      ))
  ) {
    return {
      title: "Verify the deposit",
      body: "Check the chain / wallet, then use Confirm Deposit when funds are received.",
      tone: "amber",
    };
  }
  if (["waiting_for_seller", "draft"].includes(status)) {
    return {
      title: "Waiting for seller to join",
      body: "Buyer still needs to invite the seller. No admin action required yet.",
      tone: "navy",
    };
  }
  return {
    title: "Review contract status",
    body: "Use the control center for guided transitions — every change is audited.",
    tone: "navy",
  };
}

export function partyNextStep({
  role,
  status,
  paymentStatus,
  hasSeller,
  kycBlocked,
}: {
  role: "buyer" | "seller";
  status: ContractStatus;
  paymentStatus: PaymentStatus;
  hasSeller: boolean;
  kycBlocked: boolean;
}): { title: string; body: string; tone: Tone; href?: string; linkLabel?: string } {
  if (kycBlocked) {
    return {
      title: "Complete identity verification",
      body: "This escrow requires KYC before deposits can proceed.",
      tone: "amber",
      href: "/dashboard/kyc",
      linkLabel: "Go to KYC",
    };
  }
  if (role === "buyer" && !hasSeller) {
    return {
      title: "Invite your seller",
      body: "Share the secure invite link so the seller can join this closing room.",
      tone: "amber",
    };
  }
  if (["released", "completed"].includes(status)) {
    return {
      title: "Escrow complete",
      body: "Funds have been released. Keep this page for your records.",
      tone: "green",
    };
  }
  if (["disputed", "under_mediation"].includes(status)) {
    return {
      title: "Dispute in progress",
      body: "An officer is mediating. Use chat for updates and respond promptly.",
      tone: "red",
    };
  }
  if (["deposit_confirmed", "admin_reviewing", "active_escrow", "awaiting_delivery", "delivery_completed"].includes(status)) {
    return {
      title: role === "buyer" ? "Funds are in escrow" : "Buyer deposit confirmed",
      body:
        role === "buyer"
          ? "The officer confirmed your deposit. Complete delivery, then request release when ready."
          : "Escrow is funded. Complete your side of the deal — release happens after officer review.",
      tone: "green",
    };
  }
  if (["release_requested", "admin_reviewing_release"].includes(status)) {
    return {
      title: "Release under review",
      body: "An escrow officer is reviewing the release request. Watch chat for updates.",
      tone: "amber",
    };
  }
  if (["deposit_pending", "blockchain_confirming"].includes(status)) {
    return {
      title: "Deposit under review",
      body: "An escrow officer is verifying your transfer. You’ll see updates in the timeline and chat.",
      tone: "amber",
    };
  }
  if (
    hasSeller &&
    ["unpaid", "pending"].includes(paymentStatus) &&
    ["seller_joined", "seller_accepted", "waiting_for_deposit"].includes(status)
  ) {
    return {
      title: role === "buyer" ? "Send your deposit" : "Waiting for buyer deposit",
      body:
        role === "buyer"
          ? "Send the exact amount to the escrow address, then tap I’ve sent my deposit."
          : "The buyer will fund escrow. You’ll be notified when the officer confirms it.",
      tone: role === "buyer" ? "amber" : "navy",
    };
  }
  return {
    title: "Follow the closing room",
    body: "Use messages for coordination. Status changes appear in the timeline.",
    tone: "navy",
  };
}
