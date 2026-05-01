import { Controller, Get } from '@nestjs/common';
import { CatalogService } from './catalog.service';

@Controller('catalog')
export class CatalogController {
  constructor(private catalogService: CatalogService) {}

  @Get('categories')
  getCategories() {
    return this.catalogService.categories;
  }

  @Get('stocks')
  getStocks() {
    return this.catalogService.stocks;
  }
}
