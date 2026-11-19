import Link from "next/link";
import { Phone, Mail, MapPin } from "lucide-react";
import { BrandLogo } from "@/components/brand/logo";
import { siteConfig } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-border-soft bg-navy text-white/70">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-4">
        <div className="md:col-span-1">
          <BrandLogo className="h-12" />
          <p className="mt-4 text-sm leading-relaxed">
            Licensed title, closing, and escrow services. Secure escrow for real estate and
            digital assets, secured and verified on every transaction.
          </p>
        </div>

        <div className="text-sm">
          <div className="font-semibold text-white">Services</div>
          <ul className="mt-3 space-y-2">
            <li><Link href="/real-estate-escrow" className="hover:text-white">Real Estate Escrow</Link></li>
            <li><Link href="/crypto-escrow" className="hover:text-white">Crypto Escrow</Link></li>
            <li><Link href="/real-estate-escrow#how-it-works" className="hover:text-white">How It Works</Link></li>
            <li><Link href="/#compliance" className="hover:text-white">Compliance</Link></li>
          </ul>
        </div>

        <div className="text-sm">
          <div className="font-semibold text-white">Contact</div>
          <ul className="mt-3 space-y-2">
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gold" />
              <a href={`tel:${siteConfig.phoneTel}`} className="hover:text-white">{siteConfig.phone}</a>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gold" />
              <a href={`mailto:${siteConfig.email}`} className="hover:text-white">{siteConfig.email}</a>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              {siteConfig.addressLine}
            </li>
          </ul>
        </div>

        <div className="text-sm">
          <div className="font-semibold text-white">Trust &amp; Compliance</div>
          <p className="mt-3">Licensed &amp; Bonded</p>
          <p>KYC / AML Compliant</p>
          <p>SOC 2-aligned controls</p>
          <p>Full audit logging</p>
        </div>
      </div>
      <div className="border-t border-white/10 px-6 py-4 text-center text-xs">
        © {new Date().getFullYear()} {siteConfig.legalName}. All rights reserved.
      </div>
    </footer>
  );
}
