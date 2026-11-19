import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { requireAdmin } from "@/lib/auth/session";
import { getContract, getDispute } from "@/lib/data/queries";
import { queryCollection } from "@/lib/firebase/db";
import { proposeSettlementAction, closeDisputeAction, sendDisputeMessageAction } from "@/lib/data/disputes";

export default async function AdminDisputeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdmin();
  const dispute = await getDispute(id);
  if (!dispute) notFound();
  const contract = await getContract(dispute.contract_id);
  const messages = await queryCollection<{
    id: string;
    sender_id: string;
    body: string;
    created_at: string;
    is_staff?: boolean;
  }>("disputeMessages", (ref) => ref.where("dispute_id", "==", id).orderBy("created_at", "asc"));
  const proposals = await queryCollection<{
    id: string;
    proposal: string;
    created_at: string;
  }>("settlementProposals", (ref) => ref.where("dispute_id", "==", id).orderBy("created_at", "desc"));

  return (
    <>
      <PageHeader
        title={`Dispute · ${contract?.contract_number ?? ""}`}
        description={contract?.title}
        actions={<StatusBadge status={dispute.status} />}
      />
      <div className="grid gap-6 p-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Dispute Reason</CardTitle></CardHeader>
            <CardContent className="text-sm text-gray-700">{dispute.reason}</CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Mediation Messages</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {messages.map((m) => (
                <div key={m.id} className="rounded-lg border border-border-soft px-3 py-2 text-sm">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{m.is_staff ? "Staff" : "Party"}</span>
                    <span>{formatDate(m.created_at)}</span>
                  </div>
                  <p className="mt-1 text-gray-800">{m.body}</p>
                </div>
              ))}
              <form action={sendDisputeMessageAction.bind(null, dispute.id)} className="space-y-2">
                <Textarea name="body" rows={2} required placeholder="Write a mediation message…" />
                <Button type="submit" size="sm">Send</Button>
              </form>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Settlement Proposals</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {proposals.map((p) => (
                <div key={p.id} className="rounded-lg border border-border-soft p-3 text-sm">
                  <p>{p.proposal}</p>
                  <p className="mt-1 text-xs text-gray-400">{formatDate(p.created_at)}</p>
                </div>
              ))}
              <form action={proposeSettlementAction.bind(null, dispute.id, dispute.contract_id)} className="space-y-2">
                <Label htmlFor="proposal">New proposal</Label>
                <Textarea id="proposal" name="proposal" rows={3} required />
                <Label htmlFor="reason">Reason</Label>
                <Textarea id="reason" name="reason" rows={2} required />
                <Button type="submit" size="sm">Propose Settlement</Button>
              </form>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader><CardTitle>Close Dispute</CardTitle></CardHeader>
            <CardContent>
              <form action={closeDisputeAction.bind(null, dispute.id, dispute.contract_id)} className="space-y-3">
                <div>
                  <Label htmlFor="resolution">Resolution</Label>
                  <Textarea id="resolution" name="resolution" rows={3} required />
                </div>
                <div>
                  <Label htmlFor="reason">Reason</Label>
                  <Textarea id="reason" name="reason" rows={2} required />
                </div>
                <Button type="submit" variant="danger" className="w-full">Close Dispute</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
