import { Injectable } from '@nestjs/common';
import { Client } from '@opensearch-project/opensearch';

@Injectable()
export class SearchService {
  public client: Client;

  async search(
    index_name: 'inji-barcodes' | 'inji-ya-geocoding',
    body: object,
  ) {
    return null;
  }
}
