import { gql } from 'graphql-request';

export const ImageFragmentDoc = gql`
  fragment ImageFragment on Image {
    url
    alt
  }
`;

export const ProductCardFragmentDoc = gql`
  fragment ProductCardFragment on Product {
    id
    isAvailableForPurchase
    isAvailable
    availableForPurchase
    availableForPurchaseAt
    #    channelListings {
    #      id
    #      isAvailableForPurchase
    #      isPublished
    #      visibleInListings
    #    }
    slug
    name
    category {
      id
    }
    translation(languageCode: $locale) {
      id
      name
    }
    pricing {
      onSale
      discountLocalCurrency {
        net {
          amount
        }
      }
      priceRangeLocalCurrency {
        start {
          net {
            amount
          }
        }
        stop {
          net {
            amount
          }
        }
      }
    }
    #    variants {
    #      id
    #      name
    #      quantityAvailable
    #      quantityLimitPerCustomer
    #      sku
    #      pricing {
    #        onSale
    #        discount {
    #          net {
    #            amount
    #          }
    #        }
    #        discountLocalCurrency {
    #          net {
    #            amount
    #          }
    #        }
    #        priceUndiscounted {
    #          net {
    #            amount
    #          }
    #        }
    #        priceLocalCurrency {
    #          net {
    #            amount
    #          }
    #        }
    #        price {
    #          net {
    #            amount
    #          }
    #        }
    #      }
    #    }
    defaultVariant {
      id
      name
      quantityAvailable
      quantityLimitPerCustomer
      sku
      pricing {
        onSale
        discount {
          net {
            amount
          }
        }
        discountLocalCurrency {
          net {
            amount
          }
        }
        priceUndiscounted {
          net {
            amount
          }
        }
        priceLocalCurrency {
          net {
            amount
          }
        }
        price {
          net {
            amount
          }
        }
      }
    }
    thumbnail(size: 512, format: WEBP) {
      ...ImageFragment
    }
    category {
      id
      name
      translation(languageCode: $locale) {
        id
        name
      }
    }
  }
  ${ImageFragmentDoc}
`;

export const FlatProductsQuery = gql`
  query FlatProductsQuery(
    $first: Int
    $after: String
    $locale: LanguageCodeEnum!
  ) {
    products(
      first: $first
      filter: { isPublished: true }
      after: $after
      channel: "default-channel"
    ) {
      edges {
        node {
          ...ProductCardFragment
        }
      }
      pageInfo {
        endCursor
      }
    }
  }
  ${ProductCardFragmentDoc}
`;

export const FlatCategoriesQuery = gql`
  query FlatCategoriesQuery($first: Int, $after: String) {
    categories(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          name
          backgroundImage {
            alt
            url
          }
          metadata {
            key
            value
          }
          parent {
            id
          }
        }
      }
    }
  }
`;

export const QueryCategoriesDocument = gql`
  query CategoriesOne($after: String) {
    categories(first: 100, after: $after) {
      totalCount
      edges {
        node {
          id
          name
          parent {
            id
          }
        }
      }
    }
  }
`;

export const QueryProductsDocument = gql`
  {
    products(first: 0, last: 100, channel: "uralsk") {
      totalCount
      edges {
        node {
          id
          slug
          name
          thumbnail {
            url
            alt
          }
          category {
            id
          }
          pricing {
            onSale
            priceRange {
              start {
                gross {
                  currency
                  amount
                }
              }
              stop {
                gross {
                  currency
                  amount
                }
              }
            }
          }
        }
      }
    }
  }
`;
