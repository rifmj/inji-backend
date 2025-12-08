export interface OrderLine {
  product_name: string;
  quantity: number;
}

export interface OrderAddress {
  streetAddress1?: string;
  streetAddress2?: string;
  city?: string;
  postalCode?: string;
  country?: {
    country?: string;
  };
}

export interface OrderCreatedHook {
  id: string;
  lines: OrderLine[];
  user_email: string;
  weight: string;
  billing_address?: OrderAddress;
  total_net_amount: string;
  shipping_price_net_amount: string;
}

export interface OrderUpdatedHook {
  id: string;
  status: string;
  meta?: {
    issuing_principal?: {
      id: string;
    };
  };
}

export interface OrderTransaction {
  id: string;
  reference: string;
  authorizedAmount: {
    amount: string;
  };
}

export interface OrderTransactionsResponse {
  order: {
    transactions: OrderTransaction[];
  };
}

export interface OrderFulfillmentLine {
  product_name: string;
  quantity: number;
}

export interface OrderFulfillment {
  lines: OrderFulfillmentLine[];
}

export interface OrderFulfilledHook {
  id: string;
  meta: {
    issuing_principal: {
      id: string;
    };
  };
  fulfillments: OrderFulfillment[];
}

export interface TipTopPayResponse {
  data: any;
} 