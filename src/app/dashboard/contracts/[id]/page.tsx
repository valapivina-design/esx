import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/badge";
import { ContractChat } from "@/components/contract/contract-chat";
import { ContractTimeline, ContractProgressBar } from "@/components/contract/contract-timeline";
import { NextStepBanner, partyNextStep } from "@/components/contract/next-step-banner";
import { QrCode } from "@/components/ui/qr-code";
import { formatUsd, formatDate } from "@/lib/utils";
import { requireUser } from "@/lib/auth/session";
import {
  generateInviteAction,
  requestReleaseAction,
  openDisputeAction,
  markDepositSentAction,
  sendMessageAction,
} from "@/lib/data/contracts";
import { ensureContractOfficer } from "@/lib/data/officers";
import {
  getContract,
  getPlatformWalletForAsset,
  getUser,
  listInvites,
  listMessages,
  listTimeline,
} from "@/lib/data/queries";

export default async function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { authId, profile } = await requireUser();
  let contract = await getContract(id);
  if (!contract) notFound();

  const isBuyer = contract.buyer_id === authId;
  const isSeller = contract.seller_id === authId;
  if (!isBuyer && !isSeller) notFound();

  const role = isBuyer ? "buyer" : "seller";

  // Attach default admin as escrow officer when missing (older contracts).
  if (!contract.escrow_officer_id) {
    await ensureContractOfficer(id);
    contract = (await getContract(id)) ?? contract;
  }

  const [invites, messages, timeline, buyerProfile, sellerProfile, officerProfile] = await Promise.all([
    listInvites(id),
    listMessages(id),
    listTimeline(id),
    contract.buyer_id ? getUser(contract.buyer_id) : Promise.resolve(null),
    contract.seller_id ? getUser(contract.seller_id) : Promise.resolve(null),
    contract.escrow_officer_id ? getUser(contract.escrow_officer_id) : Promise.resolve(null),
  ]);

  const names: Record<string, string> = {};
  if (buyerProfile) names[buyerProfile.id] = buyerProfile.full_name;
  if (sellerProfile) names[sellerProfile.id] = sellerProfile.full_name;
  if (officerProfile) names[officerProfile.id] = officerProfile.full_name;
  names[authId] = profile?.full_name ?? names[authId] ?? "You";

  const kycBlocked = contract.kyc_requirement === "required" && profile?.kyc_status !== "approved";
  const inviteLink = invites[0]
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/invite/${invites[0].token}`
    : null;

  const platformWallet = contract.crypto_asset
    ? await getPlatformWalletForAsset(contract.crypto_asset)
    : null;
  const depositAddress = contract.deposit_address ?? platformWallet?.address ?? null;
  const depositNetwork = contract.payment_network ?? platformWallet?.network ?? null;
  const fundedOrBeyond = [
    "deposit_confirmed",
    "admin_reviewing",
    "active_escrow",
    "awaiting_delivery",
    "delivery_completed",
    "release_requested",
    "admin_reviewing_release",
    "released",
    "completed",
    "cancelled",
    "refunded",
    "closed",
  ].includes(contract.status);

  const canDeposit =
    (isBuyer || isSeller) &&
    !!contract.seller_id &&
    ["unpaid"].includes(contract.payment_status) &&
    ["seller_joined", "seller_accepted", "waiting_for_deposit"].includes(contract.status) &&
    !fundedOrBeyond &&
    !kycBlocked;

  const depositAwaitingReview =
    ["deposit_pending", "blockchain_confirming"].includes(contract.status) ||
    (contract.payment_status === "pending" && !fundedOrBeyond);

  const next = partyNextStep({
    role,
    status: contract.status,
    paymentStatus: contract.payment_status,
    hasSeller: !!contract.seller_id,
    kycBlocked,
  });

  const canRequestRelease = [
    "deposit_confirmed",
    "admin_reviewing",
    "active_escrow",
    "awaiting_delivery",
    "delivery_completed",
  ].includes(contract.status);
  const canDispute = !["disputed", "under_mediation", "closed", "resolved", "released", "completed"].includes(
    contract.status
  );

  return (
    <>
      <PageHeader
        title={contract.title}
        description={`${contract.contract_number} · You are the ${role}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={contract.status} />
            <StatusBadge status={contract.payment_status} />
          </div>
        }
      />

      <div className="space-y-6 p-6">
        <Card className="overflow-hidden bg-navy-900 text-white" elevated>
          <CardContent className="p-6">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">
                  Closing room progress
                </p>
                <p className="mt-1 font-serif text-xl text-white">{formatUsd(contract.amount_usd)}</p>
                <p className="text-sm text-white/55">
                  {contract.amount_crypto ?? "—"} {contract.crypto_asset ?? ""}
                  {depositNetwork ? ` · ${depositNetwork}` : ""}
                </p>
              </div>
              <p className="text-xs text-white/40">Opened {formatDate(contract.created_at)}</p>
            </div>
            <ContractProgressBar status={contract.status} variant="dark" />
          </CardContent>
        </Card>

        <NextStepBanner
          title={next.title}
          body={next.body}
          tone={next.tone}
          href={next.href}
          linkLabel={next.linkLabel}
        />

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <Card elevated>
              <CardHeader>
                <CardTitle>Contract summary</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <Info label="Buyer" value={buyerProfile?.full_name ?? "—"} />
                <Info
                  label="Seller"
                  value={sellerProfile?.full_name ?? "Waiting for invite acceptance"}
                />
                <Info
                  label="Amount"
                  value={`${formatUsd(contract.amount_usd)} · ${contract.amount_crypto ?? "—"} ${contract.crypto_asset ?? ""}`}
                />
                <Info label="Your KYC" value={<StatusBadge status={profile?.kyc_status ?? "not_required"} />} />
                <Info label="Network" value={depositNetwork ?? "—"} />
                <Info label="Tx hash" value={contract.transaction_hash ?? "Not submitted yet"} mono />
              </CardContent>
              {contract.description && (
                <CardContent className="border-t border-border-soft text-sm text-gray-600">
                  {contract.description}
                </CardContent>
              )}
            </Card>

            {isBuyer && !contract.seller_id && (
              <Card elevated>
                <CardHeader>
                  <CardTitle>Invite seller</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Send a secure link. The seller creates an account (or logs in) and joins this
                    closing room.
                  </p>
                  {inviteLink ? (
                    <div className="rounded-xl border border-border-soft bg-gray-50/80 p-4">
                      <Label>Invite link</Label>
                      <Input readOnly value={inviteLink} className="mt-1 font-mono text-xs" />
                      <p className="mt-2 text-xs text-gray-400">
                        Expires {formatDate(invites[0]?.expires_at)} · Status: {invites[0]?.status}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">No invite created yet — generate one below.</p>
                  )}
                  <form action={generateInviteAction.bind(null, contract.id)} className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      name="seller_email"
                      type="email"
                      placeholder="seller@example.com"
                      required
                      className="flex-1"
                    />
                    <Button type="submit" variant="secondary">
                      {inviteLink ? "Send new link" : "Create invite"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {canDeposit && (
              <Card elevated>
                <CardHeader>
                  <CardTitle>Send deposit</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                    Send exactly{" "}
                    <strong>
                      {contract.amount_crypto ?? "—"} {contract.crypto_asset}
                    </strong>{" "}
                    on <strong>{depositNetwork ?? "the assigned network"}</strong>. After you transfer,
                    mark it sent so the officer can verify.
                  </p>
                  {depositAddress ? (
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                      <div className="shrink-0 rounded-xl border border-border-soft bg-white p-3">
                        <QrCode value={depositAddress} size={132} />
                      </div>
                      <div className="min-w-0 space-y-3">
                        <Info label="Deposit address" value={depositAddress} mono />
                        <Info label="Asset" value={`${contract.crypto_asset} · ${depositNetwork ?? "TBD"}`} />
                        <Info
                          label="Amount"
                          value={`${contract.amount_crypto ?? "—"} ${contract.crypto_asset}`}
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Deposit address will appear once the escrow officer assigns a wallet.
                    </p>
                  )}
                  <form action={markDepositSentAction.bind(null, contract.id, role)}>
                    <Button type="submit" className="w-full sm:w-auto">
                      I&apos;ve sent my deposit
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {depositAwaitingReview && (
              <Card className="border-amber-200 bg-amber-50/60" elevated>
                <CardContent className="py-5 text-sm text-amber-950">
                  <p className="font-semibold">Deposit marked as sent</p>
                  <p className="mt-1 opacity-80">
                    An escrow officer is verifying the transfer. You&apos;ll see confirmation in the
                    timeline and chat.
                  </p>
                </CardContent>
              </Card>
            )}

            {fundedOrBeyond && contract.status === "deposit_confirmed" && (
              <Card className="border-emerald-200 bg-emerald-50/60" elevated>
                <CardContent className="py-5 text-sm text-emerald-950">
                  <p className="font-semibold">Deposit confirmed</p>
                  <p className="mt-1 opacity-80">
                    Funds are held in escrow. Use chat to coordinate delivery, then request release
                    when conditions are met.
                  </p>
                </CardContent>
              </Card>
            )}

            <Card elevated className="overflow-hidden">
              <CardHeader>
                <CardTitle>Messages</CardTitle>
                <p className="mt-0.5 text-xs font-normal text-gray-400">
                  Chat with the other party and your escrow officer.
                </p>
              </CardHeader>
              <ContractChat
                messages={messages}
                onSend={sendMessageAction.bind(null, contract.id)}
                names={names}
              />
            </Card>

            <Card elevated>
              <CardHeader>
                <CardTitle>Activity timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <ContractTimeline events={timeline} />
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-6">
            <Card elevated>
              <CardHeader>
                <CardTitle>Your closing team</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-3 rounded-xl bg-gold-tint px-3 py-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-navy text-xs font-semibold text-white">
                    {(officerProfile?.full_name ?? "EO")
                      .split(" ")
                      .map((p) => p[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900">
                      {officerProfile?.full_name ?? "Escrow officer pending"}
                    </div>
                    <div className="truncate text-xs text-gray-500">
                      {officerProfile?.email
                        ? `${officerProfile.email} · reviews deposits & releases`
                        : "An officer will be assigned shortly"}
                    </div>
                  </div>
                </div>
                <Info label="Buyer" value={buyerProfile?.full_name ?? "—"} />
                <Info
                  label="Seller"
                  value={sellerProfile?.full_name ?? "Awaiting invite acceptance"}
                />
              </CardContent>
            </Card>

            <Card elevated>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {canRequestRelease && (
                  <form action={requestReleaseAction.bind(null, contract.id)}>
                    <Button type="submit" variant="success" className="w-full">
                      Request fund release
                    </Button>
                  </form>
                )}
                {canDispute && (
                  <details className="rounded-lg border border-border-soft">
                    <summary className="cursor-pointer px-3 py-2.5 text-sm font-medium text-red-600">
                      Open a dispute
                    </summary>
                    <form
                      action={openDisputeAction.bind(null, contract.id)}
                      className="space-y-2 border-t border-border-soft px-3 py-3"
                    >
                      <Textarea name="reason" rows={3} placeholder="Describe the issue" required />
                      <Button type="submit" variant="danger" size="sm" className="w-full">
                        Submit dispute
                      </Button>
                    </form>
                  </details>
                )}
                <p className="text-xs leading-relaxed text-gray-400">
                  Releases and status changes are reviewed by an escrow officer. You never need the
                  database — everything happens in this closing room.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Terms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <Info label="Delivery" value={contract.delivery_terms || "—"} />
                <Info label="Inspection" value={contract.inspection_period || "—"} />
                <Info label="Release when" value={contract.release_conditions || "—"} />
                <Info label="Disputes" value={contract.dispute_terms || "—"} />
              </CardContent>
            </Card>

            <Link
              href="/dashboard/contracts"
              className="block text-center text-sm font-medium text-gray-500 hover:text-navy"
            >
              ← Back to my contracts
            </Link>
          </aside>
        </div>
      </div>
    </>
  );
}

function Info({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] font-medium uppercase tracking-wide text-gray-400">{label}</div>
      <div className={`mt-0.5 break-all text-sm font-medium text-gray-800 ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </div>
    </div>
  );
}
