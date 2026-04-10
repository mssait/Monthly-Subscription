import * as crypto from "crypto";

/**
 * Verify a Cashfree webhook signature.
 * Cashfree sends: x-webhook-signature header = HMAC-SHA256(timestamp + rawBody, secretKey)
 * and x-webhook-timestamp header.
 */
export function verifyCashfreeWebhook(
  rawBody: string,
  signature: string,
  timestamp: string,
  secretKey: string
): boolean {
  const message = timestamp + rawBody;
  const expectedSignature = crypto
    .createHmac("sha256", secretKey)
    .update(message)
    .digest("base64");

  // Use timingSafeEqual to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}
