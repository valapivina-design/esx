import Link from "next/link";
import Image from "next/image";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { ShieldCheck, UserCheck, Eye, Coins, Lock, Scale, Clock } from "lucide-react";
import { cryptoFaqs, faqJsonLd, pageMetadata } from "@/lib/site";
import { CRYPTO_ASSETS } from "@/lib/assets";

export const metadata = pageMetadata({
  title: "Crypto Escrow Service & Bitcoin Escrow",
  description:
    "Cryptocurrency escrow services for P2P trades. Bitcoin escrow, Ripple (XRP), Ethereum, and stablecoins held in cold storage — confirmed and released by escrow officers.",
  path: "/crypto-escrow",
});

export default function CryptoEscrowPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(cryptoFaqs)) }}
      />
      <SiteHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-border-soft bg-navy-900">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(135deg, #060b1c 0%, #0b1530 50%, #131f45 100%)",
            }}
          />
          <div className="absolute -right-16 top-8 h-56 w-56 rounded-3xl bg-gradient-to-br from-gold/30 to-transparent blur-2xl" />
          <div className="absolute -left-10 bottom-0 h-48 w-48 rounded-full bg-gradient-to-tr from-white/10 to-transparent blur-2xl" />
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
          <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-6 py-20 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-gold">Crypto Escrow Service</p>
              <h1 className="mt-4 font-serif text-4xl font-bold leading-tight text-white md:text-5xl">
                Bitcoin Escrow &amp; Cryptocurrency Escrow Services
              </h1>
              <p className="mt-5 max-w-xl text-lg text-white/80">
                Open a P2P crypto escrow contract with your counterparty. We hold deposits in
                multi-signature cold storage, confirm secure crypto payments on-chain, and release
                funds only after an escrow officer reviews the deal — never automatically.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/register"
                  className="inline-flex h-12 items-center justify-center rounded-lg bg-gold px-6 text-sm font-semibold text-white shadow-[var(--shadow-card)] hover:opacity-90"
                >
                  Create Escrow
                </Link>
                <Link
                  href="/login"
                  className="inline-flex h-12 items-center justify-center rounded-lg border border-white/30 px-6 text-sm font-semibold text-white hover:bg-white/10"
                >
                  Log In
                </Link>
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-3xl">
              <Image
                src="/images/crypto-hero.jpg"
                alt="Secure cryptocurrency escrow with cold-storage protection"
                width={896}
                height={1200}
                priority
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </section>

        <section id="how-it-works" className="bg-background py-16">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="text-center font-serif text-3xl font-bold text-navy">
              How P2P crypto escrow works
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-gray-600">
              A clear three-step path from contract to release — built for buyers and sellers who want
              bitcoin escrow and multi-asset protection without exchange custody.
            </p>
            <div className="mt-8 grid gap-6 sm:grid-cols-3">
              <Step n={1} icon={<Lock className="h-5 w-5 text-gold" />} title="Buyer Creates Contract" desc="Set the asset — including Ripple (XRP) — amount, and terms, then invite the seller via a secure link." />
              <Step n={2} icon={<Scale className="h-5 w-5 text-gold" />} title="Seller Joins & Funds Confirm" desc="Seller accepts terms. Buyer sends crypto; our team confirms the deposit on-chain." />
              <Step n={3} icon={<Clock className="h-5 w-5 text-gold" />} title="Secure Manual Release" desc="Once delivery is confirmed, our escrow team reviews and releases the funds to the seller." />
            </div>
          </div>
        </section>

        <section className="border-t border-border-soft bg-white py-16">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="text-center font-serif text-3xl font-bold text-navy">Why choose our crypto escrow platform</h2>
            <div className="mt-10 grid items-center gap-10 md:grid-cols-2">
              <div className="rounded-2xl border border-border-soft bg-background p-8">
                <h3 className="text-lg font-semibold text-navy">Identity Verification (KYC)</h3>
                <ul className="mt-3 space-y-3 text-sm text-gray-600">
                  <li className="flex gap-2"><UserCheck className="h-4 w-4 shrink-0 text-gold" /> Transactions of $100 USD or less may proceed without KYC.</li>
                  <li className="flex gap-2"><ShieldCheck className="h-4 w-4 shrink-0 text-gold" /> Transactions above $100 USD require identity verification before continuing.</li>
                  <li className="flex gap-2"><Eye className="h-4 w-4 shrink-0 text-gold" /> All KYC submissions are reviewed manually by our compliance team.</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-border-soft bg-background p-8">
                <h3 className="text-lg font-semibold text-navy">Supported assets — including Ripple</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Escrow Bitcoin, Ethereum, Ripple (XRP), and major stablecoins with the same officer-reviewed process.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {CRYPTO_ASSETS.map((a) => (
                    <span key={a.id} className="inline-flex items-center gap-1 rounded-full bg-gold-tint px-3 py-1 text-sm font-medium text-navy">
                      <Coins className="h-3.5 w-3.5" /> {a.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-border-soft bg-background py-16">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="text-center font-serif text-3xl font-bold text-navy">Who uses cryptocurrency escrow services</h2>
            <p className="mt-4 text-center text-gray-600">
              Private OTC desks, domain and equipment sellers, and peer traders who need a neutral
              third party — not another exchange account — to hold crypto until both sides perform.
            </p>
            <dl className="mt-10 space-y-6">
              {cryptoFaqs.map((faq) => (
                <div key={faq.question} className="border-b border-border-soft pb-6">
                  <dt className="font-serif text-lg font-semibold text-navy">{faq.question}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-gray-600">{faq.answer}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function Step({ n, icon, title, desc }: { n: number; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-border-soft bg-white p-6 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-sm font-semibold text-white">
          {n}
        </span>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-tint">{icon}</span>
      </div>
      <h3 className="mt-4 text-sm font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{desc}</p>
    </div>
  );
}
