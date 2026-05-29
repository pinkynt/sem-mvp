const DEFAULT_STORE_EXTERNAL_ID = "SEMSTAGING001";
const DEFAULT_POS_EXTERNAL_ID = "SEMSTAGINGPOS001";

export type MercadoPagoConfig = {
  accessToken: string;
  userId: string;
  storeExternalId: string;
  posExternalId: string;
  webhookSecret?: string;
};

export function getMercadoPagoConfig(): MercadoPagoConfig {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  const userId = process.env.MERCADOPAGO_USER_ID;

  if (!accessToken) {
    throw new Error("Missing MERCADOPAGO_ACCESS_TOKEN environment variable");
  }

  if (!userId) {
    throw new Error("Missing MERCADOPAGO_USER_ID environment variable");
  }

  return {
    accessToken,
    userId,
    storeExternalId:
      process.env.MERCADOPAGO_STORE_EXTERNAL_ID ?? DEFAULT_STORE_EXTERNAL_ID,
    posExternalId:
      process.env.MERCADOPAGO_POS_EXTERNAL_ID ?? DEFAULT_POS_EXTERNAL_ID,
    webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET,
  };
}
