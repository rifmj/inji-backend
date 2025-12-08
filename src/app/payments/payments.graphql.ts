import { gql } from 'graphql-request';

export const MutationPaymentCreateDocument = gql`
  fragment PriceFragment on Money {
    currency
    amount
  }
  {
    checkoutPaymentCreate(token: $checkoutToken, input: $paymentInput) {
      payment {
        id
        total {
          ...PriceFragment
        }
      }
      errors {
        field
        message
      }
    }
  }
`;

export const MutationOrderFromCheckoutCreateDocument = gql`
  {
    orderCreateFromCheckout(id: $id) {
      order {
        id
        status
        isPaid
      }
      errors {
        field
        message
      }
    }
  }
`;
