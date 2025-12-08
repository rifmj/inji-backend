import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SaleorService } from './saleor.service';

/**
 * Сервис для синхронизации статусов заказов с Saleor.
 */
@Injectable()
export class SaleorSyncService {
  private readonly logger = new Logger(SaleorSyncService.name);

  constructor(private readonly saleorService: SaleorService) {}

  /**
   * Находит заказ в Saleor по ID заявки из AirbaPay.
   * @param airbaPayOrderId - ID, который мы сохранили в метаданных.
   * @returns {Promise<string>} GID заказа Saleor.
   */
  private async findSaleorOrderByAirbaId(
    airbaPayOrderId: string,
  ): Promise<string> {
    this.logger.log(
      `Поиск заказа Saleor с airbaPayOrderId: ${airbaPayOrderId}`,
    );

    // Ищем заказ по ключу 'airbaPayOrderId' в приватных метаданных
    const result = await this.saleorService.findOrdersByPrivateMetadata(
      'airbaPayOrderId',
      airbaPayOrderId,
    );

    if (result.orders.edges.length > 0) {
      const saleorOrderId = result.orders.edges[0].node.id;
      this.logger.log(`Найден заказ Saleor: ${saleorOrderId}`);
      return saleorOrderId;
    }

    throw new NotFoundException(
      `Заказ Saleor, связанный с заявкой AirbaPay ${airbaPayOrderId}, не найден.`,
    );
  }

  /**
   * Обрабатывает успешное завершение платежа.
   * @param airbaPayOrderId ID заявки в AirbaPay.
   */
  async handleSuccessfulPayment(airbaPayOrderId: string): Promise<void> {
    const saleorOrderId = await this.findSaleorOrderByAirbaId(airbaPayOrderId);
    this.logger.log(`Помечаем заказ ${saleorOrderId} как оплаченный.`);

    const { orderMarkAsPaid } = await this.saleorService.markOrderAsPaid(
      saleorOrderId,
    );

    if (orderMarkAsPaid.errors.length > 0) {
      this.logger.error(
        `Ошибка при попытке пометить заказ ${saleorOrderId} как оплаченный:`,
        orderMarkAsPaid.errors,
      );
      // Здесь можно добавить логику для повторных попыток или уведомлений
    } else {
      this.logger.log(
        `Заказ ${saleorOrderId} успешно помечен как оплаченный. Новый статус: ${orderMarkAsPaid.order.status}`,
      );
    }
  }

  /**
   * Обрабатывает неудачный платеж или отмену.
   * @param airbaPayOrderId ID заявки в AirbaPay.
   */
  async handleFailedPayment(airbaPayOrderId: string): Promise<void> {
    const saleorOrderId = await this.findSaleorOrderByAirbaId(airbaPayOrderId);
    this.logger.log(`Отменяем заказ ${saleorOrderId}.`);

    const { orderCancel } = await this.saleorService.cancelOrder(saleorOrderId);

    if (orderCancel.errors.length > 0) {
      this.logger.error(
        `Ошибка при отмене заказа ${saleorOrderId}:`,
        orderCancel.errors,
      );
    } else {
      this.logger.log(
        `Заказ ${saleorOrderId} успешно отменен. Новый статус: ${orderCancel.order.status}`,
      );
    }
  }
}
