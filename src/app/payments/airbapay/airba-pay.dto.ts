import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsInt,
  IsBoolean,
  ValidateNested,
  IsUrl,
  IsIn,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';

// --- DTO для взаимодействия с API Брокера ---

/**
 * DTO для аутентификации в AirbaPay.
 * @description Тело запроса для POST /auth/api/v1/authenticate
 */
export class AuthenticateRequestDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  userSecret: string;
}

/**
 * DTO для адреса в заявке.
 */
class AddressDto {
  @IsString()
  @IsNotEmpty()
  delivery: string;

  @IsString()
  @IsNotEmpty()
  pickupPoint: string;
}

/**
 * DTO для контактных данных клиента.
 */
class CustomerContactDto {
  @IsString()
  @IsNotEmpty()
  @Length(10, 10)
  mobile: string; // 10 цифр, без +7
}

/**
 * DTO для информации о клиенте.
 */
class CustomerDto {
  @ValidateNested()
  @Type(() => CustomerContactDto)
  contact: CustomerContactDto;
}

/**
 * DTO для товара в заявке.
 */
export class GoodDto {
  @IsString()
  @IsNotEmpty()
  brand: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsUrl()
  @IsOptional()
  image?: string;

  @IsString()
  @IsNotEmpty()
  merchantName: string;

  @IsString()
  @IsNotEmpty()
  model: string;

  @IsInt()
  price: number;

  @IsInt()
  quantity: number;

  @IsString()
  @IsNotEmpty()
  sku: string;
}

/**
 * DTO для финансового партнера.
 */
export class PaymentPartnerDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}

/**
 * DTO для создания предзаявки (pre-create).
 * @description Тело запроса для POST /bg-proxy-general/api/v1/order/pre-create
 */
export class CreatePreOrderDto {
  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;

  @IsUrl()
  callbackUrl: string;

  @IsIn(['web', 'mob', 'android', 'ios'])
  channel: string;

  @ValidateNested()
  @Type(() => CustomerDto)
  customer: CustomerDto;

  @IsUrl()
  @IsOptional()
  failureBackUrl?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GoodDto)
  goods: GoodDto[];

  @IsBoolean()
  isDelivery: boolean;

  @IsInt()
  loanLength: number; // 0 для всех предложений

  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentPartnerDto)
  paymentPartners: PaymentPartnerDto[];

  @IsIn(['loan', 'installment'])
  productType: string;

  @IsString()
  @IsNotEmpty()
  salesCode: string;

  @IsString()
  @IsNotEmpty()
  salesPlace: string; // Почтовый индекс, например 050000

  @IsUrl()
  successBackUrl: string;

  @IsInt()
  totalCost: number;
}

/**
 * DTO для обновления статуса заявки мерчантом.
 * @description Тело запроса для POST /bg-proxy-general/api/v1/order/update-state
 */
export class UpdateOrderStateByMerchantDto {
  @IsString()
  @IsNotEmpty()
  merchantCode: string;

  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsIn(['completed', 'merchant_cancelled', 'refunded'])
  state: string;
}

// --- DTO для Интерфейса Мерчанта (Callback/Webhook) ---

/**
 * DTO для авторизации брокера на стороне мерчанта.
 * @description Тело запроса, которое AirbaPay присылает на эндпоинт мерчанта /authenticate
 */
export class AuthenticateBrokerDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

/**
 * DTO для обновления статуса заявки от брокера.
 * @description Тело запроса, которое AirbaPay присылает на callbackUrl мерчанта.
 */
export class UpdateOrderStatusByBrokerDto {
  @IsString()
  @IsNotEmpty()
  merchantCode: string;

  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsIn([
    'created',
    'confirmed',
    'completed',
    'rejected',
    'merchant_cancelled',
    'customer_cancelled',
    'refunded',
  ])
  state: string;
}
