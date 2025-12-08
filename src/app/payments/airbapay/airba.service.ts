import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import {
  AuthenticateRequestDto,
  CreatePreOrderDto,
  UpdateOrderStateByMerchantDto,
} from './airba-pay.dto';

/**
 * Сервис для взаимодействия с API кредитного брокера AirbaPay.
 */
@Injectable()
export class AirbaService {
  private apiBaseUrl: string;
  private authToken: string;
  private tokenExpiry: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    // URL следует хранить в конфигурационных файлах (.env)
    this.apiBaseUrl = this.configService.get<string>(
      'AIRBAPAY_API_URL',
      'https://sapi.airbapay.kz/bg-proxy-general/api/v1',
    );
  }

  /**
   * Получает JWT токен для авторизации запросов.
   * Автоматически кеширует токен до истечения его срока действия.
   * @returns {Promise<string>} JWT токен.
   */
  async getAuthToken(): Promise<string> {
    if (this.authToken && Date.now() < this.tokenExpiry) {
      return this.authToken;
    }

    const authUrl = this.configService.get<string>(
      'AIRBAPAY_AUTH_URL',
      'https://sapi.airbapay.kz/auth/api/v1/authenticate',
    );
    const credentials: AuthenticateRequestDto = {
      userId: this.configService.get<string>('AIRBAPAY_USER_ID'),
      userSecret: this.configService.get<string>('AIRBAPAY_USER_SECRET'),
    };

    try {
      const { data } = await firstValueFrom(
        this.httpService.post(authUrl, credentials),
      );
      this.authToken = data.accessToken;
      // Устанавливаем время истечения токена с небольшим запасом (60 секунд)
      this.tokenExpiry = Date.now() + (data.expiresIn - 60) * 1000;
      return this.authToken;
    } catch (error) {
      // Обработка ошибок сети или API
      throw new HttpException(
        'Ошибка аутентификации в AirbaPay',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  /**
   * Создает предзаявку на рассрочку/кредит.
   * @param {CreatePreOrderDto} createPreOrderDto - DTO для создания заявки.
   * @returns {Promise<any>} Ответ от API, содержащий redirectUrl.
   * @see "Создание заявки" в документации.
   */
  async createPreOrder(createPreOrderDto: CreatePreOrderDto): Promise<any> {
    const token = await this.getAuthToken();
    const url = `${this.apiBaseUrl}/order/pre-create`;

    try {
      const { data } = await firstValueFrom(
        this.httpService.post(url, createPreOrderDto, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      );
      return data; // Ожидается ответ вида { orderId, redirectUrl }
    } catch (error) {
      // Здесь можно добавить более детальную обработку ошибок на основе кодов ответа
      throw new HttpException(
        'Ошибка при создании заявки в AirbaPay',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Получает список доступных финансовых партнеров.
   * @returns {Promise<any>} Список финансовых партнеров.
   * @see "Список финансовых партнеров" в документации.
   */
  async getPaymentPartners(): Promise<any> {
    const token = await this.getAuthToken();
    const url = `${this.apiBaseUrl}/order/payment-partners`;
    try {
      const { data } = await firstValueFrom(
        this.httpService.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      );
      return data;
    } catch (error) {
      throw new HttpException(
        'Ошибка при получении списка финансовых партнеров',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Обновляет статус заявки со стороны мерчанта.
   * Используется для завершения, отмены или возврата заказа.
   * @param {UpdateOrderStateByMerchantDto} updateDto - DTO с данными для обновления.
   * @returns {Promise<any>} Ответ от API.
   * @see "Обновление статуса заявки" в документации.
   */
  async updateOrderState(
    updateDto: UpdateOrderStateByMerchantDto,
  ): Promise<any> {
    const token = await this.getAuthToken();
    const url = `${this.apiBaseUrl}/order/update-state`;
    try {
      const { data } = await firstValueFrom(
        this.httpService.post(url, updateDto, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      );
      return data;
    } catch (error) {
      throw new HttpException(
        'Ошибка при обновлении статуса заявки',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
