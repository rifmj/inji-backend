import { gql } from 'graphql-request';

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
