import type { Metadata } from "next";

export const siteConfig = {
  name: "101 Escrow Services",
  shortName: "101 Escrow",
  legalName: "101 Escrow Services",
  description:
    "Crypto escrow service and bitcoin escrow for P2P trades, plus real estate closings. Secure cryptocurrency escrow services with cold storage and manual officer release.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://101escrowservices.net",
  /** Staff portal on a separate subdomain (never linked from marketing SEO). */
  adminUrl: process.env.NEXT_PUBLIC_ADMIN_URL || "https://admin.101escrowservices.net",
  email: "support@101escrowservices.net",
  phone: "(626) 999-5969",
  phoneTel: "+16269995969",
  address: {
    street: "101 S Main St, 1st Floor",
    city: "Pomona",
    region: "CA",
    postalCode: "91766",
    country: "US",
  },
  addressLine: "101 S Main St, 1st Floor, Pomona, CA 91766",
};

export const landingFaqs = [
  {
    question: "What is a crypto escrow service?",
    answer:
      "A crypto escrow service holds cryptocurrency between a buyer and seller until both sides meet the agreed terms. 101 Escrow Services confirms deposits, verifies delivery conditions, and releases funds manually — never by an automated bot.",
  },
  {
    question: "Do you offer bitcoin escrow and Ripple (XRP) escrow?",
    answer:
      "Yes. Our cryptocurrency escrow services support Bitcoin (BTC), Ethereum (ETH), Ripple (XRP), USDT, USDC, Solana (SOL), and Litecoin (LTC). Each deposit is reviewed by an escrow officer before release.",
  },
  {
    question: "Is this suitable for P2P crypto trades?",
    answer:
      "Yes. Our P2P crypto escrow workflow lets buyers create a contract, invite the seller, fund cold-storage custody, and request release after delivery — with KYC above $100 USD and full audit logging.",
  },
  {
    question: "How do secure crypto payments work on your platform?",
    answer:
      "You send crypto to a dedicated deposit address. We confirm the on-chain receipt, hold assets in multi-signature cold storage, and only release after the escrow officer authorizes settlement under the contract terms.",
  },
  {
    question: "How is 101 Escrow different from other crypto escrow companies?",
    answer:
      "We combine a dedicated crypto escrow platform with licensed, bonded escrow practices: officer-reviewed releases, KYC/AML screening, dispute mediation, and a permanent audit trail on every action.",
  },
] as const;

export const cryptoFaqs = [
  {
    question: "What cryptocurrencies can I escrow?",
    answer:
      "We accept Bitcoin, Ethereum, Ripple (XRP), Tether (USDT), USD Coin (USDC), Solana, and Litecoin for bitcoin escrow and broader cryptocurrency escrow services.",
  },
  {
    question: "How does P2P crypto escrow work here?",
    answer:
      "The buyer opens a contract, invites the seller, both parties agree to terms, crypto is deposited to cold storage, and our team manually releases funds when conditions are met.",
  },
  {
    question: "When is KYC required?",
    answer:
      "Transactions at or under $100 USD may proceed without KYC. Above $100, identity verification is required and reviewed by our compliance team before the escrow continues.",
  },
] as const;

/** Open Graph fields every page shares. A page-level `openGraph` replaces the
 *  root one wholesale, so pages that set their own must spread these back in. */
export const baseOpenGraph = {
  type: "website",
  siteName: siteConfig.name,
  locale: "en_US",
} satisfies Metadata["openGraph"];

/**
 * Metadata for a public page: title, description, canonical URL and og:url.
 * og:title / og:description / twitter fields are left unset on purpose so
 * Next.js fills them from `title` and `description`.
 */
export function pageMetadata({
  title,
  description,
  path,
}: {
  title?: string;
  description?: string;
  path: string;
}): Metadata {
  return {
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    alternates: { canonical: path },
    openGraph: { ...baseOpenGraph, url: path },
  };
}

/** Organization JSON-LD for the root layout. */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FinancialService",
    name: siteConfig.name,
    legalName: siteConfig.legalName,
    url: siteConfig.url,
    logo: `${siteConfig.url}/images/logo.svg`,
    image: `${siteConfig.url}/opengraph-image`,
    description: siteConfig.description,
    email: siteConfig.email,
    telephone: siteConfig.phoneTel,
    address: {
      "@type": "PostalAddress",
      streetAddress: siteConfig.address.street,
      addressLocality: siteConfig.address.city,
      addressRegion: siteConfig.address.region,
      postalCode: siteConfig.address.postalCode,
      addressCountry: siteConfig.address.country,
    },
    areaServed: "US",
    sameAs: [siteConfig.url],
    knowsAbout: [
      "crypto escrow",
      "bitcoin escrow",
      "cryptocurrency escrow services",
      "P2P crypto escrow",
      "Ripple XRP escrow",
      "real estate escrow",
    ],
  };
}

export function faqJsonLd(faqs: readonly { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}
