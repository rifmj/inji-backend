export interface SaleorCustomerCreatedHook {
  type: string;
  id: string;
  default_shipping_address: null;
  default_billing_address: null;
  addresses: null;
  meta: Meta;
  private_metadata: Metadata;
  metadata: Metadata;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  date_joined: Date;
  language_code: string;
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
