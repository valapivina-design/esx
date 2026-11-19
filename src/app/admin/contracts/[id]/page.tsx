import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ContractChat } from "@/components/contract/contract-chat";
import { ContractTimeline, ContractProgressBar } from "@/components/contract/contract-timeline";
import { ManualActionsPanel } from "@/components/admin/manual-actions-panel";
import { NextStepBanner, adminNextStep } from "@/components/contract/next-step-banner";
import { formatUsd, formatDate } from "@/lib/utils";
import { requireAdmin } from "@/lib/auth/session";
import { addInternalNoteAction, editContractAction, setContractStatusAction } from "@/lib/data/admin-actions";
import { sendMessageAction } from "@/lib/data/contracts";
import { CRYPTO_ASSETS } from "@/lib/assets";
import { ensureContractOfficer } from "@/lib/data/officers";
import { getContract, getUser, listAdminNotes, listMessages, listTimeline, listDisputes, listAuditLogs } from "@/lib/data/queries";

const CONTRACT_STATUSES = [
  "draft", "waiting_for_seller", "seller_joined", "seller_accepted",
  "waiting_for_deposit", "deposit_pending", "blockchain_confirming", "deposit_confirmed",
  "admin_reviewing", "active_escrow", "awaiting_delivery", "delivery_completed",
  "release_requested", "admin_reviewing_release", "released", "completed",
  "cancelled", "refunded", "disputed", "under_mediation", "resolved", "closed",
] as const;
const PAYMENT_STATUSES = ["unpaid", "pending", "paid", "failed", "refunded", "released"] as const;

export default async function AdminContractDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const { authId } = await requireAdmin();
  let contract = await getContract(id);
  if (!contract) notFound();

  // Link this contract to an escrow officer if buyer created it without one.
  if (!contract.escrow_officer_id) {
    await ensureContractOfficer(id, authId);
    contract = (await getContract(id)) ?? contract;
  }

  const [buyer, seller, officer, messages, timeline, notes, disputes, auditLogs] = await Promise.all([
    contract.buyer_id ? getUser(contract.buyer_id) : Promise.resolve(null),
    contract.seller_id ? getUser(contract.seller_id) : Promise.resolve(null),
    contract.escrow_officer_id ? getUser(contract.escrow_officer_id) : Promise.resolve(null),
    listMessages(id),
    listTimeline(id),
    listAdminNotes(id),
    listDisputes(),
    listAuditLogs(),
  ]);
  const dispute = disputes.find((d) => d.contract_id === id) ?? null;
  const contractAudit = auditLogs.filter((l) => l.entity_id === id);
  const next = adminNextStep(contract.status, contract.payment_status);

  const names: Record<string, string> = { [authId]: "You (Admin)" };
  if (buyer) names[buyer.id] = buyer.full_name;
  if (seller) names[seller.id] = seller.full_name;
  if (officer) names[officer.id] = officer.full_name;

  return (
    <>
      <PageHeader
        title={contract.contract_number}
        description={`${contract.title} · Updated ${formatDate(contract.updated_at)}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={contract.status} />
            <StatusBadge status={contract.payment_status} />
            {contract.is_locked && <StatusBadge status="suspended" />}
            <Link
              href="/admin/contracts"
              className="text-sm font-medium text-gray-500 hover:text-navy"
            >
              All contracts
            </Link>
          </div>
        }
      />

      {error && (
        <div className="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

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
                  {contract.payment_network ? ` · ${contract.payment_network}` : ""}
                </p>
              </div>
              <p className="text-xs text-white/40">Created {formatDate(contract.created_at)}</p>
            </div>
            <ContractProgressBar status={contract.status} variant="dark" />
          </CardContent>
        </Card>

        <NextStepBanner title={next.title} body={next.body} tone={next.tone} />

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <Card elevated>
              <CardHeader>
                <CardTitle>Parties &amp; funding</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-3">
                <PartyCard
                  role="Buyer"
                  name={buyer?.full_name}
                  email={buyer?.email}
                  kyc={buyer?.kyc_status}
                  verified={buyer?.is_verified}
                />
                <PartyCard
                  role="Seller"
                  name={seller?.full_name}
                  email={seller?.email}
                  kyc={seller?.kyc_status}
                  verified={seller?.is_verified}
                  emptyLabel="Not joined yet"
                />
                <PartyCard
                  role="Escrow officer"
                  name={officer?.full_name}
                  email={officer?.email}
                  kyc={officer?.kyc_status}
                  verified={officer?.is_verified}
                  emptyLabel="Unassigned — open Control center to claim"
                />
                <div className="rounded-xl border border-border-soft bg-gray-50/80 p-4 sm:col-span-3">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Info label="Deposit address" value={contract.deposit_address ?? "Not assigned"} mono />
                    <Info label="Transaction hash" value={contract.transaction_hash ?? "Not submitted"} mono />
                    <Info label="Confirmations" value={String(contract.confirmations)} />
                  </div>
                </div>
              </CardContent>
              {contract.description && (
                <CardContent className="border-t border-border-soft text-sm text-gray-600">
                  {contract.description}
                </CardContent>
              )}
            </Card>

            {dispute && (
              <Card className="border-red-200 bg-red-50/50" elevated>
                <CardHeader>
                  <CardTitle>Active dispute</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <StatusBadge status={dispute.status} />
                  <p className="text-gray-700">{dispute.reason}</p>
                  <Link
                    href={`/admin/disputes/${dispute.id}`}
                    className="inline-block font-medium text-navy underline underline-offset-2"
                  >
                    Open mediation center
                  </Link>
                </CardContent>
              </Card>
            )}

            <Card elevated className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between gap-3">
                <div>
                  <CardTitle>Closing room chat</CardTitle>
                  <p className="mt-0.5 text-xs font-normal text-gray-400">
                    Join as escrow officer — messages are visible to buyer and seller.
                  </p>
                </div>
              </CardHeader>
              <ContractChat messages={messages} onSend={sendMessageAction.bind(null, contract.id)} names={names} />
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card elevated>
                <CardHeader>
                  <CardTitle>Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <ContractTimeline events={timeline} />
                </CardContent>
              </Card>

              <Card elevated>
                <CardHeader>
                  <CardTitle>Audit log</CardTitle>
                </CardHeader>
                <CardContent className="max-h-[420px] space-y-2 overflow-y-auto text-sm">
                  {contractAudit.map((log) => (
                    <div key={log.id} className="rounded-lg border border-border-soft px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium capitalize text-gray-900">
                          {log.action.replaceAll("_", " ")}
                        </span>
                        <span className="shrink-0 text-xs text-gray-400">{formatDate(log.created_at)}</span>
                      </div>
                      <p className="mt-1 text-gray-600">{log.reason}</p>
                    </div>
                  ))}
                  {contractAudit.length === 0 && (
                    <p className="text-gray-400">No admin actions recorded yet.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <details className="group rounded-xl border border-border-soft bg-white shadow-sm open:shadow-[var(--shadow-card)]">
              <summary className="cursor-pointer list-none px-5 py-4 marker:content-none [&::-webkit-details-marker]:hidden">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-navy">Edit contract fields</h3>
                    <p className="text-xs text-gray-400">Title, amounts, addresses — requires an audit reason</p>
                  </div>
                  <span className="text-xs font-medium text-gray-400 group-open:hidden">Expand</span>
                  <span className="hidden text-xs font-medium text-gray-400 group-open:inline">Collapse</span>
                </div>
              </summary>
              <div className="border-t border-border-soft px-5 py-4">
                <form action={editContractAction.bind(null, contract.id)} className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input id="title" name="title" defaultValue={contract.title} />
                    </div>
                    <div>
                      <Label htmlFor="crypto_asset">Crypto asset</Label>
                      <Select id="crypto_asset" name="crypto_asset" defaultValue={contract.crypto_asset ?? "BTC"}>
                        {CRYPTO_ASSETS.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="amount_usd">USD value</Label>
                      <Input id="amount_usd" name="amount_usd" type="number" step="0.01" defaultValue={contract.amount_usd} />
                    </div>
                    <div>
                      <Label htmlFor="amount_crypto">Amount (crypto)</Label>
                      <Input
                        id="amount_crypto"
                        name="amount_crypto"
                        type="number"
                        step="0.00000001"
                        defaultValue={contract.amount_crypto ?? ""}
                      />
                    </div>
                    <div>
                      <Label htmlFor="deposit_address">Deposit address</Label>
                      <Input id="deposit_address" name="deposit_address" defaultValue={contract.deposit_address ?? ""} />
                    </div>
                    <div>
                      <Label htmlFor="transaction_hash">Transaction hash</Label>
                      <Input id="transaction_hash" name="transaction_hash" defaultValue={contract.transaction_hash ?? ""} />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" rows={2} defaultValue={contract.description ?? ""} />
                  </div>
                  <div>
                    <Label htmlFor="release_conditions">Release conditions</Label>
                    <Textarea
                      id="release_conditions"
                      name="release_conditions"
                      rows={2}
                      defaultValue={contract.release_conditions ?? ""}
                    />
                  </div>
                  <div>
                    <Label htmlFor="reason">Reason for edit (required)</Label>
                    <Textarea id="reason" name="reason" rows={2} required placeholder="Why is this contract being edited?" />
                  </div>
                  <Button type="submit" variant="outline">
                    Save changes
                  </Button>
                </form>
              </div>
            </details>
          </div>

          <aside className="space-y-6 xl:sticky xl:top-6">
            <ManualActionsPanel
              contractId={contract.id}
              status={contract.status}
              paymentStatus={contract.payment_status}
            />

            <Card>
              <CardHeader>
                <CardTitle>Override status</CardTitle>
              </CardHeader>
              <CardContent>
                <form action={setContractStatusAction.bind(null, contract.id)} className="space-y-3">
                  <div>
                    <Label htmlFor="status">Contract status</Label>
                    <Select id="status" name="status" defaultValue={contract.status}>
                      {CONTRACT_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s.replaceAll("_", " ")}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="payment_status">Payment status</Label>
                    <Select id="payment_status" name="payment_status" defaultValue={contract.payment_status}>
                      {PAYMENT_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s.replaceAll("_", " ")}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <Button type="submit" className="w-full" variant="outline">
                    Update status
                  </Button>
                  <p className="text-xs text-gray-400">
                    Prefer Control center actions above — they record a clearer audit trail.
                  </p>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Internal notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <form action={addInternalNoteAction.bind(null, contract.id)} className="space-y-2">
                  <Textarea name="body" rows={3} placeholder="Staff-only note…" required />
                  <Button type="submit" size="sm" className="w-full" variant="outline">
                    Add note
                  </Button>
                </form>
                <div className="max-h-56 space-y-2 overflow-y-auto">
                  {notes.map((n) => (
                    <div key={n.id} className="rounded-lg bg-gray-50 px-3 py-2 text-sm">
                      <p className="text-gray-700">{n.body}</p>
                      <p className="mt-1 text-xs text-gray-400">{formatDate(n.created_at)}</p>
                    </div>
                  ))}
                  {notes.length === 0 && <p className="text-sm text-gray-400">No notes yet.</p>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Terms snapshot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <Info label="Release conditions" value={contract.release_conditions || "—"} />
                <Info label="Delivery terms" value={contract.delivery_terms || "—"} />
                <Info label="Inspection period" value={contract.inspection_period || "—"} />
                <Info label="Dispute terms" value={contract.dispute_terms || "—"} />
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </>
  );
}

function PartyCard({
  role,
  name,
  email,
  kyc,
  verified,
  emptyLabel = "—",
}: {
  role: string;
  name?: string | null;
  email?: string | null;
  kyc?: string | null;
  verified?: boolean;
  emptyLabel?: string;
}) {
  return (
    <div className="rounded-xl border border-border-soft p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">{role}</p>
      <p className="mt-1 text-sm font-semibold text-gray-900">{name ?? emptyLabel}</p>
      {email && <p className="mt-0.5 truncate text-xs text-gray-500">{email}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {kyc && <StatusBadge status={kyc} />}
        {verified != null && (
          <span className={`text-xs font-medium ${verified ? "text-emerald-700" : "text-gray-400"}`}>
            {verified ? "Verified" : "Unverified"}
          </span>
        )}
      </div>
    </div>
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
