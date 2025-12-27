import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";

let loaded = false;

export function loadEnv() {
  if (!loaded) {
    dotenvConfig({ path: resolve(process.cwd(), ".env") });
    loaded = true;
  }
}

export function getEnv(key: string) {
  loadEnv();
  return process.env[key];
}
