import { gql } from 'graphql-request';

export const MutationTokenCreateDocument = gql`
  mutation TokenCreate($email: String!, $password: String!) {
    tokenCreate(email: $email, password: $password) {
      token
      csrfToken
      refreshToken
      errors {
        field
        code
        message
      }
    }
  }
`;

export const MutationAccountRegisterDocument = gql`
  mutation AccountRegister(
    $email: String!
    $password: String!
    $channel: String!
    $redirectUrl: String
  ) {
    accountRegister(
      input: {
        email: $email
        password: $password
        channel: $channel
        redirectUrl: $redirectUrl
      }
    ) {
      accountErrors {
        field
        code
      }
      user {
        email
        isActive
      }
    }
  }
`;

// Used at account-deletion time. Saleor requires an authenticated token to
// delete the account; the staff token from SALEOR_BACKEND_TOKEN cannot delete
// customer accounts. We call accountRequestDeletion which sends a verification
// email — sufficient for cleanup. If you want hard delete, expose a staff
// mutation or use customerDelete from a staff app.
export const MutationCustomerBulkDeleteDocument = gql`
  mutation CustomerBulkDelete($ids: [ID!]!) {
    customerBulkDelete(ids: $ids) {
      count
      errors {
        field
        code
        message
      }
    }
  }
`;

export const QueryCustomerByEmailDocument = gql`
  query CustomerByEmail($email: String!) {
    user(email: $email) {
      id
      email
    }
  }
`;
