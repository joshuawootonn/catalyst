'use server';

import { expirePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';

import { getSessionCustomerAccessToken } from '~/auth';
import { client } from '~/client';
import { graphql, VariablesOf } from '~/client/graphql';
import { parseAccountFormData } from '~/components/form-fields/shared/parse-fields';

const UpdateCustomerMutation = graphql(`
  mutation UpdateCustomerMutation($input: UpdateCustomerInput!) {
    customer {
      updateCustomer(input: $input) {
        customer {
          firstName
          lastName
        }
        errors {
          __typename
          ... on UnexpectedUpdateCustomerError {
            message
          }
          ... on EmailAlreadyInUseError {
            message
          }
          ... on ValidationError {
            message
          }
          ... on CustomerDoesNotExistError {
            message
          }
          ... on CustomerNotLoggedInError {
            message
          }
        }
      }
    }
  }
`);

type AddCustomerAddressInput = VariablesOf<typeof UpdateCustomerMutation>['input'];

const isUpdateCustomerInput = (data: unknown): data is AddCustomerAddressInput => {
  if (
    typeof data === 'object' &&
    data !== null &&
    ('firstName' in data ||
      'lastName' in data ||
      'email' in data ||
      'phone' in data ||
      'company' in data ||
      'formFields' in data)
  ) {
    return true;
  }

  return false;
};

export const updateCustomer = async (formData: FormData) => {
  const t = await getTranslations('Account.Settings.UpdateCustomer');
  const customerAccessToken = await getSessionCustomerAccessToken();

  const parsed = parseAccountFormData(formData);

  if (!isUpdateCustomerInput(parsed)) {
    return {
      status: 'error',
      errors: [t('Errors.inputError')],
    };
  }

  const response = await client.fetch({
    document: UpdateCustomerMutation,
    customerAccessToken,
    fetchOptions: { cache: 'no-store' },
    variables: {
      input: parsed,
    },
  });

  expirePath('/account/settings', 'page');

  const result = response.data.customer.updateCustomer;

  if (result.errors.length === 0) {
    const { customer } = result;

    if (!customer) {
      return {
        status: 'error',
        errors: [t('Errors.notFound')],
      };
    }

    const { firstName, lastName } = customer;

    return { status: 'success', data: { firstName, lastName } };
  }

  return {
    status: 'error',
    errors: result.errors.map((error) => error.message),
  };
};
