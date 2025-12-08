export interface SaleorOrderCreatedHook {
  type: string;
  id: string;
  channel: Channel;
  shipping_address: IngAddress;
  billing_address: IngAddress;
  discounts: null;
  token: string;
  user_email: string;
  created: Date;
  original: string;
  lines: Line[];
  fulfillments: any[];
  collection_point: null;
  payments: any[];
  shipping_method: ShippingMethod;
  meta: Meta;
  private_metadata: Metadata;
  metadata: Metadata;
  status: string;
  language_code: string;
  origin: string;
  shipping_method_name: string;
  collection_point_name: null;
  shipping_price_net_amount: string;
  shipping_price_gross_amount: string;
  shipping_tax_rate: string;
  total_net_amount: string;
  undiscounted_total_net_amount: string;
  total_gross_amount: string;
  undiscounted_total_gross_amount: string;
  weight: string;
}

export interface IngAddress {
  type: string;
  id: string;
  first_name: string;
  last_name: string;
  company_name: string;
  street_address_1: string;
  street_address_2: string;
  city: string;
  city_area: string;
  postal_code: string;
  country: string;
  country_area: string;
  phone: string;
}

export interface Channel {
  type: string;
  id: string;
  slug: string;
  currency_code: string;
}

export interface Line {
  type: string;
  id: string;
  product_variant_id: string;
  total_price_net_amount: string;
  total_price_gross_amount: string;
  allocations: any[];
  product_name: string;
  variant_name: string;
  translated_product_name: string;
  translated_variant_name: string;
  product_sku: null;
  quantity: number;
  currency: string;
  unit_discount_amount: string;
  unit_discount_type: string;
  unit_discount_reason: string;
  unit_price_net_amount: string;
  unit_price_gross_amount: string;
  undiscounted_unit_price_gross_amount: string;
  undiscounted_unit_price_net_amount: string;
  undiscounted_total_price_gross_amount: string;
  undiscounted_total_price_net_amount: string;
  tax_rate: string;
  voucher_code: null;
  sale_id: string;
}

export interface Meta {
  issued_at: Date;
  version: string;
  issuing_principal: IssuingPrincipal;
}

export interface IssuingPrincipal {
  id: string;
  type: string;
}

export interface Metadata {}

export interface ShippingMethod {
  type: string;
  id: string;
  currency: string;
  price_amount: string;
  name: string;
}
