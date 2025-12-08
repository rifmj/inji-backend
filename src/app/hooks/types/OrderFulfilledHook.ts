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