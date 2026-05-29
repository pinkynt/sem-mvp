export type MercadoPagoQrMode = "static" | "dynamic" | "hybrid";

export type MercadoPagoStoreLocation = {
  street_number: string;
  street_name: string;
  city_name: string;
  state_name: string;
  latitude: number;
  longitude: number;
  reference?: string;
};

export type MercadoPagoStoreResponse = {
  id: number;
  name: string;
  external_id: string;
  date_created?: string;
};

export type MercadoPagoPosResponse = {
  id: number;
  name: string;
  external_id: string;
  external_store_id: string;
  store_id: number;
  fixed_amount: boolean;
  status: string;
  user_id: number;
  uuid?: string;
  qr?: {
    image?: string;
    template_document?: string;
    template_image?: string;
  };
};

export type MercadoPagoQrOrderResponse = {
  id: string;
  user_id?: string;
  type?: "qr";
  external_reference?: string;
  description?: string;
  expiration_time?: string;
  processing_mode?: string;
  total_amount?: string;
  total_paid_amount?: string;
  country_code?: string;
  status?: string;
  status_detail?: string;
  currency?: string;
  created_date?: string;
  last_updated_date?: string;
  config?: {
    qr?: {
      external_pos_id?: string;
      mode?: MercadoPagoQrMode;
    };
  };
  transactions?: {
    payments?: Array<{
      id?: string;
      amount?: string;
      paid_amount?: string;
      refunded_amount?: string;
      status?: string;
      status_detail?: string;
      payment_method?: {
        id?: string;
        type?: string;
        installments?: number;
      };
    }>;
    refunds?: Array<{
      id?: string;
      transaction_id?: string;
      amount?: string;
      status?: string;
    }>;
  };
  type_response?: {
    qr_data?: string;
  };
};

export type MercadoPagoOrderWebhookBody = {
  action?: string;
  api_version?: string;
  application_id?: string;
  data?: {
    id?: string;
    external_reference?: string;
    status?: string;
    status_detail?: string;
    total_amount?: string;
    total_paid_amount?: string;
  };
  date_created?: string;
  live_mode?: boolean;
  type?: string;
  user_id?: string;
};
