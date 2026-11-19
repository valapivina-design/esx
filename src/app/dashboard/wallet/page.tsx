import QRCode from "qrcode";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getBalances, getBalanceHistory, requestDepositAction } from "@/lib/data/balances";
import { listPlatformWallets } from "@/lib/data/queries";
import { CRYPTO_ASSETS, type CryptoAssetId } from "@/lib/assets";
import { DepositPanel, type DepositWalletOption } from "@/components/wallet/deposit-panel";
import { DepositHistory } from "@/components/wallet/deposit-history";

export default async function WalletPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { authId } = await requireUser();
  const { ok, error } = await searchParams;
  const [balances, history, wallets] = await Promise.all([
    getBalances(authId),
    getBalanceHistory(authId),
    listPlatformWallets(),
  ]);

  const depositWallets: DepositWalletOption[] = await Promise.all(
    wallets.map(async (w) => ({
      asset: w.crypto_asset as CryptoAssetId,
      address: w.address,
      network: w.network,
      label: w.label,
      qrDataUrl: await QRCode.toDataURL(w.address, { margin: 1, width: 160 }),
    }))
  );

  const defaultAsset: CryptoAssetId = "USDT";

  return (
    <>
      <PageHeader
        title="Wallet"
        description="Send crypto to the matching deposit address, then request credit for officer confirmation."
      />
      <div className="space-y-6 p-6">
        {ok && (
          <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Deposit submitted. It shows as <strong>pending review</strong> until an officer confirms it on-chain.
          </div>
        )}
        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CRYPTO_ASSETS.map((a) => {
            const bal = balances.find((b) => b.asset === a.id);
            return (
              <Card key={a.id}>
                <CardContent className="pt-6">
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">{a.name}</div>
                  <div className="mt-2 font-serif text-2xl font-bold text-navy">{bal?.available ?? 0}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <DepositPanel wallets={depositWallets} action={requestDepositAction} defaultAsset={defaultAsset} />

        <DepositHistory history={history} />
      </div>
    </>
  );
}
