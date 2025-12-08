import { Controller, Get } from '@nestjs/common';

@Controller('remote-config')
export class RemoteConfigController {
  @Get('mobile')
  getMobileConfig() {
    return {
      auth: {
        debug_mode: false,
        disable_tg: true,
        disable_whatsapp: true,
        agreement_url: 'https://salem.inji.kz/privacypolicy/',
      },
      catalog: {
        opening_hour: 10,
        closing_hour: 19,
      },
      cart: {
        order_min_amount: 500,
        is_stocks_checking_enabled: true,
        enable_delivery_method_selection: false,
      },
    };
  }
}
