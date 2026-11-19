import { AuthShell } from "@/components/marketing/auth-shell";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { adminSignInAction } from "@/lib/auth/actions";
import { publicAbsoluteUrl } from "@/lib/hosts";
import { ShieldCheck } from "lucide-react";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <AuthShell title="Admin Portal" subtitle="Secure staff subdomain — separate from the client site.">
      <div className="mb-4 flex items-center gap-2 rounded-lg bg-navy/5 px-3 py-2 text-sm text-navy">
        <ShieldCheck className="h-4 w-4 text-gold" />
        Restricted access — administrators only. Session cookie stays on this host.
      </div>
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}
      <form action={adminSignInAction} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required placeholder="admin@101escrowservices.net" />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" required placeholder="••••••••" />
        </div>
        <Button type="submit" className="w-full">Enter Admin Portal</Button>
      </form>
      <p className="mt-6 text-center text-xs text-gray-400">
        Client portal:{" "}
        <a href={publicAbsoluteUrl("/login")} className="text-navy hover:underline">
          {publicAbsoluteUrl("/login")}
        </a>
      </p>
    </AuthShell>
  );
}
