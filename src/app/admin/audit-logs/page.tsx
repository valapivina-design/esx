import { PageHeader } from "@/components/layout/dashboard-shell";
import { Table, Thead, Th, Tr, Td } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { requireAdmin } from "@/lib/auth/session";
import { listAuditLogs } from "@/lib/data/queries";

export default async function AuditLogsPage() {
  await requireAdmin();
  const logs = await listAuditLogs();
  return (
    <>
      <PageHeader title="Audit Logs" description="Every admin action is recorded permanently." />
      <div className="p-6">
        <Table>
          <Thead>
            <tr>
              <Th>When</Th>
              <Th>Actor</Th>
              <Th>Action</Th>
              <Th>Entity</Th>
              <Th>Reason</Th>
            </tr>
          </Thead>
          <tbody>
            {logs.map((l) => (
              <Tr key={l.id}>
                <Td>{formatDate(l.created_at)}</Td>
                <Td className="font-mono text-xs">{l.actor_id?.slice(0, 8) ?? "—"}</Td>
                <Td className="font-medium">{l.action}</Td>
                <Td>{l.entity_type} {l.entity_id ? `· ${l.entity_id.slice(0, 8)}` : ""}</Td>
                <Td className="max-w-xs truncate text-sm text-gray-600">{l.reason ?? "—"}</Td>
              </Tr>
            ))}
            {logs.length === 0 && (
              <Tr><Td colSpan={5} className="py-10 text-center text-gray-400">No audit entries yet.</Td></Tr>
            )}
          </tbody>
        </Table>
      </div>
    </>
  );
}
