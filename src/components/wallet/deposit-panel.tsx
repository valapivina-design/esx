"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CRYPTO_ASSETS, assetLabel, type CryptoAssetId } from "@/lib/assets";
import { Check, Copy, Wallet } from "lucide-react";

export type DepositWalletOption = {
  asset: CryptoAssetId;
  address: string;
  network: string | null;
  label: string | null;
  qrDataUrl: string;
};

export function DepositPanel({
  wallets,
  action,
  defaultAsset,
}: {
  wallets: DepositWalletOption[];
  action: (formData: FormData) => Promise<void>;
  defaultAsset?: CryptoAssetId;
}) {
  const byAsset = React.useMemo(() => {
    const map = new Map<string, DepositWalletOption>();
    for (const w of wallets) {
      if (!map.has(w.asset)) map.set(w.asset, w);
    }
    return map;
  }, [wallets]);

  const initial = defaultAsset ?? "USDT";

  const [asset, setAsset] = React.useState<CryptoAssetId>(initial);
  const [copied, setCopied] = React.useState(false);
  const selected = byAsset.get(asset) ?? null;

  async function copyAddress() {
    if (!selected?.address) return;
    try {
      await navigator.clipboard.writeText(selected.address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard may be blocked; ignore.
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Deposit address for {assetLabel(asset)}</CardTitle>
        </CardHeader>
        <CardContent>
          {selected ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selected.qrDataUrl}
                alt={`QR code for ${assetLabel(asset)} deposit address`}
                width={120}
                height={120}
                className="shrink-0 rounded-lg border border-border-soft bg-white p-2"
              />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="text-sm font-semibold text-navy">{assetLabel(asset)}</div>
                {selected.network && (
                  <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Network · {selected.network}
                  </div>
                )}
                {selected.label && <div className="text-xs text-gray-500">{selected.label}</div>}
                <div className="break-all rounded-lg bg-gray-50 px-3 py-2 font-mono text-xs text-gray-800">
                  {selected.address}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={copyAddress}>
                  {copied ? (
                    <>
                      <Check className="mr-1.5 h-3.5 w-3.5" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy address
                    </>
                  )}
                </Button>
                <p className="text-xs text-gray-500">
                  Send only {asset} to this address. The QR updates when you change the asset below.
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border-soft px-4 py-8 text-center text-sm text-gray-500">
              No platform deposit address is configured for <span className="font-medium text-navy">{assetLabel(asset)}</span> yet.
              Choose another asset, or ask an escrow officer to add one under Admin → Wallets.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Request deposit credit</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-3">
            <div>
              <Label htmlFor="asset">Asset</Label>
              <Select
                id="asset"
                name="asset"
                value={asset}
                onChange={(e) => setAsset(e.target.value as CryptoAssetId)}
                required
              >
                {CRYPTO_ASSETS.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                    {byAsset.has(a.id) ? "" : " — no address yet"}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="amount">Amount sent on-chain</Label>
              <Input id="amount" name="amount" type="number" step="any" min="0" required placeholder="0.00" />
            </div>
            <div>
              <Label htmlFor="tx_hash">Transaction hash / ID (optional)</Label>
              <Input
                id="tx_hash"
                name="tx_hash"
                placeholder="Paste the on-chain tx id so officers can verify faster"
              />
            </div>
            <Button type="submit" className="w-full" disabled={!selected}>
              <Wallet className="mr-2 h-4 w-4" />
              {selected ? "I sent it — submit for confirmation" : "Select an asset with a deposit address"}
            </Button>
            <p className="text-xs text-gray-500">
              After you send crypto to the address on the left, submit here. Status stays{" "}
              <span className="font-medium text-amber-800">pending</span> until an officer confirms it on-chain.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
