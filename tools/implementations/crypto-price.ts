// tools/implementations/crypto-price.ts
import type { ToolDefinition } from "../tool-types.ts";
import fetch from "node-fetch";

export const CryptoPriceTool: ToolDefinition = {
  id: "crypto-price",
  name: "Crypto Price (CoinGecko)",
  description: "Fetch cryptocurrency prices from the CoinGecko API",
  params: [
    { name: "coin", type: "string", required: true, description: "Cryptocurrency ID (e.g. bitcoin, ethereum, dogecoin)" },
    { name: "currency", type: "string", required: false, description: "Target currency (e.g. usd, eur, aud, default=usd)" }
  ],

  async call({ coin, currency = "usd" }) {
    if (!coin) throw new Error("Missing required param: coin");

    try {
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=${currency}`;
      const res = await fetch(url);
      const data = await res.json();
      return data;
    } catch (err: any) {
      throw new Error(`CoinGecko API error: ${err.message}`);
    }
  }
};