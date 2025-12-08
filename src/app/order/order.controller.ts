import { Body, Controller, Post, ValidationPipe } from '@nestjs/common';
import { OrderService } from './order.service';
import { IsNotEmpty, IsString } from 'class-validator';

class CreatePaymentDto {
  @IsString()
  @IsNotEmpty()
  saleorOrderId: string;
}

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  /**
   * Эндпоинт для инициации платежа через AirbaPay для заказа Saleor.
   * @param {CreatePaymentDto} body - DTO с ID заказа Saleor.
   */
  @Post('create-airba-payment')
  async createAirbaPayment(@Body(new ValidationPipe()) body: CreatePaymentDto) {
    return this.orderService.createAirbaPayment(body.saleorOrderId);
  }
}
