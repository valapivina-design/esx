import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/session";
import { listSettings } from "@/lib/data/queries";
import { updateSettingAction } from "@/lib/data/settings";

const KEYS: Record<string, string> = {
  supported_crypto_assets: "Supported Crypto Assets (JSON array)",
  kyc_threshold_usd: "KYC Threshold (USD)",
  support_email: "Support Email",
};

export default async function AdminSettingsPage() {
  await requireAdmin();
  const rows = await listSettings();
  const valueOf = (key: string) => rows.find((r) => r.key === key || r.id === key)?.value ?? "";

  return (
    <>
      <PageHeader title="Platform Settings" description="Configure thresholds and supported assets from the dashboard." />
      <div className="grid max-w-3xl gap-6 p-6">
        {Object.entries(KEYS).map(([key, label]) => (
          <Card key={key}>
            <CardHeader><CardTitle>{label}</CardTitle></CardHeader>
            <CardContent>
              <form action={updateSettingAction.bind(null, key)} className="space-y-3">
                <div>
                  <Label htmlFor={key}>{key}</Label>
                  {key === "supported_crypto_assets" ? (
                    <Textarea id={key} name="value" rows={3} defaultValue={valueOf(key) || '["BTC","ETH","XRP","USDT","USDC","SOL","LTC"]'} />
                  ) : (
                    <Input id={key} name="value" defaultValue={valueOf(key)} />
                  )}
                </div>
                <Button type="submit" size="sm">Save</Button>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
