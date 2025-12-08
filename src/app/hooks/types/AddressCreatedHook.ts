export interface AddressCreatedHook {
  id: string;
  city: string;
  country: Country;
  company_name: string;
  meta: Meta;
}

export type AddressUpdatedHook = AddressCreatedHook;

export interface Country {
  code: string;
  name: string;
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
