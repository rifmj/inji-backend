import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { PushService } from './push.service';
import { SaleorService } from '../../saleor/saleor.service';
import { gql } from 'graphql-request';

@Controller('push')
export class PushController {
  constructor(
    private pushService: PushService,
    private saleorService: SaleorService,
  ) {}

  @Get('msgs')
  sendOrderDeliveringPush() {
    return this.pushService.sendToUser('VXNlcjo4', {
      notification: {
        title: 'Ура!',
        body: 'Ваш заказ собран и скоро будет у вас',
      },
    });
  }

  private async getOrderById(orderId: string) {
    const res = await this.saleorService.client.request(
      gql`
        query GetOrderById($orderId: ID!) {
          order(id: $orderId) {
            id
            isPaid
            user {
              id
            }
          }
        }
      `,
      {
        orderId,
      },
    );
    return res;
  }

  @Post('control/:orderId/delivering')
  async deliveringOrderById(
    @Param('orderId') orderId: string,
    @Query('car') car: string,
  ) {
    if (!orderId) {
      return null;
    }
    const res = await this.getOrderById(orderId);
    if (res?.order?.user?.id) {
      await this.pushService.sendToUser(res.order.user.id, {
        notification: {
          title: 'Заказ в пути',
          body: `Ваш заказ доставляет ${car}`,
        },
      });
    }
    return res;
  }

  @Post('control/:orderId/delivered')
  async deliveredOrderById(@Param('orderId') orderId: string) {
    if (!orderId) {
      return null;
    }
    const res = await this.getOrderById(orderId);
    if (res?.order?.user?.id) {
      await this.pushService.sendToUser(res.order.user.id, {
        notification: {
          title: 'Заказ доставлен',
          body: `Приятного аппетита :)`,
        },
      });
    }
    return res;
  }

  @Post('control/:orderId/near')
  async nearOrderById(@Param('orderId') orderId: string) {
    if (!orderId) {
      return null;
    }
    const res = await this.getOrderById(orderId);
    if (res?.order?.user?.id) {
      await this.pushService.sendToUser(res.order.user.id, {
        notification: {
          title: 'Курьер уже близко',
          body: `И будет у вас через несколько минут`,
        },
      });
    }
    return res;
  }

  @Get('control/:orderId')
  async controlOrderById(@Param('orderId') orderId: string) {
    if (!orderId) {
      return null;
    }
    const orderData = await this.getOrderById(orderId);
    return `<html>
      <head>
      </head>
      <body>
      <h2>Заказ ${orderData.order.id}</h2>
      <h2>Управление</h2>
      <p>
        <button id="delivering">Заказ собран</button>
        </p>
        <p>
        <button id="near">Заказ близко</button>
        </p>
        <p>
        <button id="delivered">Заказ доставлен</button>
        </p>
        
        <script>
        (function() {
            
            const delivering = document.getElementById("delivering");
            const near = document.getElementById("near");
            const delivered = document.getElementById("delivered");
            const orderData = ${JSON.stringify(orderData)};
          
            near.onclick = function () {
              fetch(
                "/push/control/" +
                  orderData.order.id +
                  "/near",
                {
                  method: "POST"
                }
              ).then(function(r){
                alert('Отправлено уведомление');
                return r.json();
              }).catch(function(e){
                alert('Произошла ошибка');
              });
            }
            
            delivered.onclick = function () {
              fetch(
                "/push/control/" +
                  orderData.order.id +
                  "/delivered",
                {
                  method: "POST"
                }
              ).then(function(r){
                alert('Отправлено уведомление');
                return r.json();
              }).catch(function(e){
                alert('Произошла ошибка');
              });
            }
            
            delivering.onclick = function () {
              const res = prompt("Пожалуйста, введите номер машины");
              if (!res) {
                return;
              }
              fetch(
                "/push/control/" +
                  orderData.order.id +
                  "/delivering?car=" +
                  res,
                {
                  method: "POST"
                }
              ).then(function(r){
                alert('Отправлено уведомление');
                return r.json();
              }).catch(function(e){
                alert('Произошла ошибка');
              });
            };
          
          })();
        </script>
      </body>
    </html>`;
  }
}
