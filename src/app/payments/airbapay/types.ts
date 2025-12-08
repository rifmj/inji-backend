export class CreatePaymentDto {
  amount: number;
  currency: string;
  paymentMethod: string;
}

export class ConfirmPaymentDto {
  id: string;
  transactionId: string;
}

export class CancelPaymentDto {
  id: string;
}

export class RefundPaymentDto {
  id: string;
  amount: number;
}

export class Payment {
  id: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: string;
  transactionId: string;
  createdAt: Date;
  updatedAt: Date;
}
