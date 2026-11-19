import Link from "next/link";
import { AuthShell } from "@/components/marketing/auth-shell";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; oobCode?: string }>;
}) {
  const { error, oobCode } = await searchParams;
  return (
    <AuthShell title="Set a new password" subtitle="Choose a new password for your 101 Escrow account.">
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}
      {!oobCode ? (
        <div className="space-y-4 text-sm text-gray-600">
          <p>Open the reset link from your email to continue. If the link expired, request a new one.</p>
          <Link href="/forgot-password" className="font-medium text-navy hover:underline">
            Request a new reset link
          </Link>
        </div>
      ) : (
        <form action="/api/auth/reset-password" method="post" className="space-y-4">
          <input type="hidden" name="oobCode" value={oobCode} />
          <div>
            <Label htmlFor="password">New password</Label>
            <Input id="password" name="password" type="password" required minLength={6} placeholder="At least 6 characters" />
          </div>
          <Button type="submit" className="w-full">Update password</Button>
        </form>
      )}
    </AuthShell>
  );
}
