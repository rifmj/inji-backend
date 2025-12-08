import { gql } from 'graphql-request';

export const ORDER_CREATE_MUTATION = gql`
  mutation OrderCreateFromCheckout($id: ID!) {
    orderCreateFromCheckout(id: $id, removeCheckout: true) {
      order {
        id
      }
      errors {
        variants
        lines
        message
        code
        field
      }
    }
  }
`;

export const GET_ORDER_TRANSACTIONS_QUERY = gql`
  query getOrder($id: ID!) {
    orders {
      edges {
        node {
          id
          subtotal {
            net {
              amount
            }
          }
          lines {
            productName
            quantity
          }
          shippingAddress {
            streetAddress1
            streetAddress2
          }
          total {
            net {
              amount
            }
          }
        }
      }
    }
    order(id: $id) {
      id
      transactions {
        id
        reference
        authorizedAmount {
          amount
        }
      }
    }
  }
`;

export const TRANSACTION_UPDATE_MUTATION = gql`
  mutation TransactionUpdate(
    $id: ID!
    $reference: String!
    $amount: PositiveDecimal!
  ) {
    transactionUpdate(
      id: $id
      transaction: {
        status: "Charged"
        availableActions: [REFUND]
        amountAuthorized: { currency: "KZT", amount: 0 }
        amountCharged: { currency: "KZT", amount: $amount }
      }
      transactionEvent: {
        status: SUCCESS
        name: "Charged credit card"
        reference: $reference
      }
    ) {
      transaction {
        id
      }
      errors {
        code
        message
        field
      }
    }
  }
`;

export const GET_CHECKOUT_QUERY = gql`
  query GetCheckout($id: ID!) {
    checkout(id: $id) {
      id
      isShippingRequired
    }
  }
`; 