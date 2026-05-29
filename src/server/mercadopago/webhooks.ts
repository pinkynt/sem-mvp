import crypto from "node:crypto";

type VerifyMercadoPagoWebhookSignatureInput = {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string | null;
  secret: string;
};

export function verifyMercadoPagoWebhookSignature({
  xSignature,
  xRequestId,
  dataId,
  secret,
}: VerifyMercadoPagoWebhookSignatureInput): boolean {
  if (!xSignature || !xRequestId || !dataId) {
    return false;
  }

  const signatureParts = Object.fromEntries(
    xSignature.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key?.trim(), value?.trim()];
    }),
  );

  const timestamp = signatureParts.ts;
  const receivedHash = signatureParts.v1;

  if (!timestamp || !receivedHash) {
    return false;
  }

  const manifest = `id:${dataId.toLowerCase()};request-id:${xRequestId};ts:${timestamp};`;
  const expectedHash = crypto
    .createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");

  const expectedHashBuffer = Buffer.from(expectedHash, "hex");
  const receivedHashBuffer = Buffer.from(receivedHash, "hex");

  if (expectedHashBuffer.length !== receivedHashBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedHashBuffer, receivedHashBuffer);
}
