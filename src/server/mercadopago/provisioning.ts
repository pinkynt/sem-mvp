import { getMercadoPagoConfig } from "./config";
import { mercadoPagoRequest } from "./http";
import type {
  MercadoPagoPosResponse,
  MercadoPagoStoreLocation,
  MercadoPagoStoreResponse,
} from "./types";

const STAGING_STORE_LOCATION: MercadoPagoStoreLocation = {
  street_name: "Av. Independencia",
  street_number: "974",
  city_name: "Salta",
  state_name: "Salta",
  latitude: -24.80824817511608,
  longitude: -65.40310854995933,
};

type CreateStoreInput = {
  name?: string;
  externalId?: string;
  location?: MercadoPagoStoreLocation;
};

type CreatePosInput = {
  name?: string;
  externalId?: string;
  storeId: number;
  externalStoreId: string;
};

export async function createMercadoPagoStore({
  name = "SEM Staging Store",
  externalId,
  location = STAGING_STORE_LOCATION,
}: CreateStoreInput = {}): Promise<MercadoPagoStoreResponse> {
  const { userId, storeExternalId } = getMercadoPagoConfig();

  return mercadoPagoRequest<MercadoPagoStoreResponse>(`/users/${userId}/stores`, {
    method: "POST",
    body: {
      name,
      external_id: externalId ?? storeExternalId,
      location,
    },
  });
}

export async function createMercadoPagoPos({
  name = "SEM Staging POS",
  externalId,
  storeId,
  externalStoreId,
}: CreatePosInput): Promise<MercadoPagoPosResponse> {
  const { posExternalId } = getMercadoPagoConfig();

  return mercadoPagoRequest<MercadoPagoPosResponse>("/pos", {
    method: "POST",
    body: {
      name,
      fixed_amount: true,
      store_id: storeId,
      external_store_id: externalStoreId,
      external_id: externalId ?? posExternalId,
    },
  });
}

export async function provisionMercadoPagoQrPoint() {
  const store = await createMercadoPagoStore();
  const pos = await createMercadoPagoPos({
    storeId: store.id,
    externalStoreId: store.external_id,
  });

  return { store, pos };
}
