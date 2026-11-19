import Link from "next/link";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { AdminActionButton } from "@/components/admin/action-button";
import { formatDate } from "@/lib/utils";
import { requireAdmin } from "@/lib/auth/session";
import { getUser, queryAllKyc } from "@/lib/data/queries";
import { performUserActionAction } from "@/lib/data/admin-users";
import { FileImage, Clock4, ShieldCheck, XCircle } from "lucide-react";

export default async function AdminKycQueuePage() {
  await requireAdmin();
  const all = await queryAllKyc();
  const users = await Promise.all([...new Set(all.map((s) => s.user_id))].map((id) => getUser(id)));
  const userOf = (id: string) => users.find((u) => u?.id === id);

  const pendingCount = all.filter((s) => s.status === "pending").length;
  const approvedCount = all.filter((s) => s.status === "approved").length;
  const rejectedCount = all.filter((s) => s.status === "rejected").length;

  return (
    <>
      <PageHeader title="Compliance Dashboard" description="Approve or reject KYC without opening Firebase Console." />
      <div className="grid gap-4 p-6 sm:grid-cols-3">
        <StatCard label="Pending Review" value={String(pendingCount)} icon={<Clock4 className="h-5 w-5" />} tone="amber" />
        <StatCard label="Approved" value={String(approvedCount)} icon={<ShieldCheck className="h-5 w-5" />} tone="green" />
        <StatCard label="Rejected" value={String(rejectedCount)} icon={<XCircle className="h-5 w-5" />} tone="red" />
      </div>
      <div className="grid gap-4 p-6 pt-0">
        {all.map((s) => {
          const user = userOf(s.user_id);
          const docs = [
            { label: "Government ID", path: s.id_document_url },
            { label: "Passport / National ID", path: s.passport_url },
            { label: "Proof of Address", path: s.proof_of_address_url },
            { label: "Selfie", path: s.selfie_url },
            { label: "Liveness Check", path: s.liveness_check_url },
          ];
          return (
            <Card key={s.id}>
              <CardHeader className="flex items-center justify-between">
                <CardTitle>{user?.full_name || user?.email || s.user_id}</CardTitle>
                <StatusBadge status={s.status} />
              </CardHeader>
              <CardContent className="grid gap-4 lg:grid-cols-3">
                <div className="space-y-3 lg:col-span-2">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {docs.map((d) => (
                      <div key={d.label} className={`flex flex-col gap-2 rounded-lg border p-2 text-center ${d.path ? "border-border-soft" : "border-dashed opacity-60"}`}>
                        <div className="flex h-24 items-center justify-center rounded-md bg-gray-50">
                          <FileImage className={`h-6 w-6 ${d.path ? "text-gold" : "text-gray-300"}`} />
                        </div>
                        <span className="text-xs font-medium text-gray-700">{d.label}</span>
                        <span className="truncate px-1 text-[10px] text-gray-400">{d.path ? "Uploaded" : "Not submitted"}</span>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
                    <span className="font-medium text-gray-800">Phone:</span> {user?.phone || "—"}
                    <span className="mx-2 text-gray-300">·</span>
                    <span className="font-medium text-gray-800">Email:</span> {user?.email || "—"}
                  </div>
                  <p className="text-xs text-gray-400">Submitted {formatDate(s.submitted_at)}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <AdminActionButton label="Approve KYC" action={performUserActionAction.bind(null, s.user_id, "approve_kyc")} variant="success" />
                  <AdminActionButton label="Reject KYC" action={performUserActionAction.bind(null, s.user_id, "reject_kyc")} variant="danger" />
                  <AdminActionButton label="Request More Info" action={performUserActionAction.bind(null, s.user_id, "request_more_kyc_info")} />
                  <Link href={`/admin/users/${s.user_id}`} className="text-center text-sm text-navy underline">View full profile</Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {all.length === 0 && <p className="text-sm text-gray-400">No KYC submissions yet.</p>}
      </div>
    </>
  );
}
