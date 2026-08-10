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

// Идентификатор Keruen хранится в метаданных аккаунта покупателя. Читаем его с
// заказа (а не принимаем от клиента), поэтому это работает для любой версии
// мобильного приложения, включая старые сборки.
export const ORDER_CUSTOMER_KER_ID_QUERY = gql`
  query OrderCustomerKerId($id: ID!) {
    order(id: $id) {
      user {
        metadata {
          key
          value
        }
      }
    }
  }
`;

// Проставляет kerId на самом заказе: значение фиксируется на момент покупки и
// остаётся в заказе, даже если покупатель потом поменяет его в профиле.
// `orderCreateFromCheckout` не принимает metadata аргументом, поэтому это
// отдельная мутация после создания заказа.
export const ORDER_UPDATE_METADATA_MUTATION = gql`
  mutation OrderUpdateMetadata($id: ID!, $input: [MetadataInput!]!) {
    updateMetadata(id: $id, input: $input) {
      errors {
        field
        code
        message
      }
    }
  }
`;
