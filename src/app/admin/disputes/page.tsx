import Link from "next/link";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Table, Thead, Th, Tr, Td } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { requireAdmin } from "@/lib/auth/session";
import { listDisputes } from "@/lib/data/queries";

export default async function AdminDisputesPage() {
  await requireAdmin();
  const disputes = await listDisputes();
  return (
    <>
      <PageHeader title="Disputes" description="Open and historical dispute cases." />
      <div className="p-6">
        <Table>
          <Thead>
            <tr>
              <Th>Contract</Th>
              <Th>Status</Th>
              <Th>Reason</Th>
              <Th>Opened</Th>
              <Th></Th>
            </tr>
          </Thead>
          <tbody>
            {disputes.map((d) => (
              <Tr key={d.id}>
                <Td className="font-mono text-xs">{d.contract_id.slice(0, 10)}…</Td>
                <Td><StatusBadge status={d.status} /></Td>
                <Td className="max-w-sm truncate">{d.reason}</Td>
                <Td>{formatDate(d.created_at)}</Td>
                <Td><Link href={`/admin/disputes/${d.id}`} className="font-medium text-navy hover:underline">Open</Link></Td>
              </Tr>
            ))}
            {disputes.length === 0 && (
              <Tr><Td colSpan={5} className="py-10 text-center text-gray-400">No disputes.</Td></Tr>
            )}
          </tbody>
        </Table>
      </div>
    </>
  );
}
