export interface QueryCategoriesResponse {
  [categories: string]: {
    totalCount: number;
    edges: {
      node: Category;
    }[];
  };
}

export interface Category {
  id: string;
  name: string;
  parent: {
    id: string;
  };
}
