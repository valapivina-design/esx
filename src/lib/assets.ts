/** Accepted cryptocurrencies for escrow contracts and wallets. */
export const CRYPTO_ASSETS = [
  { id: "BTC", name: "Bitcoin (BTC)" },
  { id: "ETH", name: "Ethereum (ETH)" },
  { id: "XRP", name: "Ripple (XRP)" },
  { id: "USDT", name: "Tether (USDT)" },
  { id: "USDC", name: "USD Coin (USDC)" },
  { id: "SOL", name: "Solana (SOL)" },
  { id: "LTC", name: "Litecoin (LTC)" },
] as const;

export type CryptoAssetId = (typeof CRYPTO_ASSETS)[number]["id"];

export const CRYPTO_ASSET_IDS = CRYPTO_ASSETS.map((a) => a.id) as CryptoAssetId[];

export function assetLabel(id: string | null | undefined): string {
  if (!id) return "—";
  return CRYPTO_ASSETS.find((a) => a.id === id)?.name ?? id;
}
