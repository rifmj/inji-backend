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
    $redirectUrl: String!
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
