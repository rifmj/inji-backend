import { Controller, Get } from '@nestjs/common';
import { CatalogService } from './catalog.service';

@Controller('catalog')
export class CatalogController {
  constructor(private catalogService: CatalogService) {}

  @Get('refresh')
  refresh() {
    return Promise.all([
      this.catalogService.refreshCategories(),
      this.catalogService.refreshProducts(),
    ]);
  }

  @Get('categories')
  getCategories() {
    return this.catalogService.categories;
  }

  @Get('products')
  getProducts() {
    return this.catalogService.products;
    // return this.catalogService.products.filter(
    //   (p) =>
    //     p?.defaultVariant?.pricing?.price?.net?.amount &&
    //     p?.defaultVariant?.pricing?.price?.net?.amount > 0,
    // );
  }

  @Get('stocks')
  getStocks() {
    return this.catalogService.stocks;
  }
}
