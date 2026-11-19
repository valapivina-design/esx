import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, Thead, Th, Tr, Td } from "@/components/ui/table";
import { Input, Label, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { requireAdmin } from "@/lib/auth/session";
import { listPendingBalanceTx, listUsers } from "@/lib/data/queries";
import { approveDepositAction, rejectDepositAction, adjustBalanceAction } from "@/lib/data/balances";
import { CRYPTO_ASSETS } from "@/lib/assets";

export default async function AdminBalancesPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  await requireAdmin();
  const { ok, error } = await searchParams;
  const [pending, users] = await Promise.all([listPendingBalanceTx(), listUsers()]);

  return (
    <>
      <PageHeader title="Balances" description="Approve deposit requests and adjust balances from the dashboard." />
      <div className="space-y-6 p-6">
        {ok && <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Action completed: {ok}</div>}
        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <Card>
          <CardHeader><CardTitle>Pending Deposit Requests</CardTitle></CardHeader>
          <CardContent className="!p-0">
            <Table className="border-0">
              <Thead>
                <tr>
                  <Th>User</Th>
                  <Th>Asset</Th>
                  <Th>Amount</Th>
                  <Th>On-chain tx</Th>
                  <Th>Requested</Th>
                  <Th></Th>
                </tr>
              </Thead>
              <tbody>
                {pending.map((tx) => (
                  <Tr key={tx.id}>
                    <Td className="font-mono text-xs">{tx.user_id.slice(0, 10)}…</Td>
                    <Td>{tx.asset}</Td>
                    <Td>{tx.amount}</Td>
                    <Td className="max-w-[10rem] truncate font-mono text-xs text-gray-500" title={tx.tx_hash ?? undefined}>
                      {tx.tx_hash || "—"}
                    </Td>
                    <Td>{formatDate(tx.created_at)}</Td>
                    <Td className="flex gap-2">
                      <form action={approveDepositAction.bind(null, tx.id)}>
                        <Button type="submit" size="sm" variant="success">Confirm on-chain</Button>
                      </form>
                      <form action={rejectDepositAction.bind(null, tx.id)}>
                        <Button type="submit" size="sm" variant="danger">Reject</Button>
                      </form>
                    </Td>
                  </Tr>
                ))}
                {pending.length === 0 && (
                  <Tr><Td colSpan={6} className="py-8 text-center text-gray-400">No pending requests.</Td></Tr>
                )}
              </tbody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Manual Balance Adjustment</CardTitle></CardHeader>
          <CardContent>
            <form action={adjustBalanceAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <Label htmlFor="user_id">User</Label>
                <Select id="user_id" name="user_id" required>
                  <option value="">Select user…</option>
                  {users.map((u) => <option key={u.id} value={u.id}>{u.full_name || u.email}</option>)}
                </Select>
              </div>
              <div>
                <Label htmlFor="asset">Asset</Label>
                <Select id="asset" name="asset" defaultValue="USDT">
                  {CRYPTO_ASSETS.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </Select>
              </div>
              <div>
                <Label htmlFor="amount">Amount (+/−)</Label>
                <Input id="amount" name="amount" type="number" step="any" required />
              </div>
              <div className="flex items-end">
                <Button type="submit" className="w-full">Adjust</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
