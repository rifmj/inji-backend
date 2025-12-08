export interface QueryCategoriesResponse {
  [categories: string]: {
    totalCount: number;
    edges: {
      node: Category;
    }[];
  };
}

export interface QueryProductsResponse {
  [products: string]: {
    totalCount: number;
    edges: {
      node: Product;
    }[];
  };
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  thumbnail?: {
    url: string;
    alt: string;
  };
  category: { id: string };
  pricing: { onSale: false; priceRange: { start: any; stop: any } };
}

export interface Category {
  id: string;
  name: string;
  parent: {
    id: string;
  };
}
