import { ethers } from "ethers";
import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";
import { ApiKeyCreds, Chain, ClobClient } from "@polymarket/clob-client";

dotenvConfig({ path: resolve(import.meta.dirname, "../../.env") });
const host = "https://clob.polymarket.com";

export async function getClient() {
  const wallet = new ethers.Wallet(`${process.env.POLYMARKET_PRIVATE_KEY}`);
  const chainId = parseInt(`${process.env.CHAIN_ID || Chain.AMOY}`) as Chain;
  console.log(`Address: ${await wallet.getAddress()}, chainId: ${chainId}`);

  const host = process.env.CLOB_API_URL || "http://localhost:8080";
  const creds: ApiKeyCreds = {
    key: `${process.env.CLOB_API_KEY}`,
    secret: `${process.env.CLOB_SECRET}`,
    passphrase: `${process.env.CLOB_PASS_PHRASE}`,
  };
  const clobClient = new ClobClient(host, chainId, wallet, creds);
}
