import { gql } from 'graphql-request';

export const ORDER_CREATE_MUTATION = gql`
  mutation OrderCreateFromCheckout($id: ID!) {
    orderCreateFromCheckout(id: $id, removeCheckout: true) {
      order {
        id
        total {
          gross {
            amount
            currency
          }
        }
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

// Records a successful card payment on the freshly created order so Saleor
// reflects it as paid. $id is the ORDER id, $reference is the TipTopPay
// TransactionId, $amount is the charged amount (KZT).
export const TRANSACTION_CREATE_MUTATION = gql`
  mutation TransactionCreate(
    $id: ID!
    $reference: String!
    $amount: PositiveDecimal!
  ) {
    transactionCreate(
      id: $id
      transaction: {
        type: "Оплата картой (TipTopPay)"
        status: "Charged"
        reference: $reference
        availableActions: [REFUND]
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