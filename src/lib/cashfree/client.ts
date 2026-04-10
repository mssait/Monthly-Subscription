// Cashfree server-side API client
// Docs: https://docs.cashfree.com/docs/pg-new-apis-enums

export const CASHFREE_BASE_URL = {
  sandbox: "https://sandbox.cashfree.com/pg",
  production: "https://api.cashfree.com/pg",
} as const;

export type CashfreeEnv = "sandbox" | "production";

export interface CashfreeConfig {
  appId: string;
  secretKey: string;
  env: CashfreeEnv;
}

export function getCashfreeHeaders(config: CashfreeConfig) {
  return {
    "x-client-id": config.appId,
    "x-client-secret": config.secretKey,
    "x-api-version": "2023-08-01",
    "Content-Type": "application/json",
  };
}

export function getDefaultCashfreeConfig(): CashfreeConfig {
  return {
    appId: process.env.CASHFREE_APP_ID!,
    secretKey: process.env.CASHFREE_SECRET_KEY!,
    env: (process.env.CASHFREE_ENV ?? "sandbox") as CashfreeEnv,
  };
}
