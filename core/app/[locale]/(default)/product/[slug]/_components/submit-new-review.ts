'use server';

import { z } from 'zod';
import { client } from '~/client';
import { graphql } from '~/client/graphql';
import { getSessionCustomerId } from '~/auth';

const ReviewSchema = z.object({
  author: z.string(),
  email: z.string().email().optional(),
  rating: z.string(),
  text: z.string().trim(),
  title: z.string().trim(),
  productEntityId: z.string(),
});

const SubmitNewReviewMutation = graphql(`
  mutation SubmitNewReviewMutation($input: AddProductReviewInput!) {
    catalog {
      addProductReview(input: $input) {
        errors {
          __typename
          ... on Error {
            message
          }
        }
      }
    }
  }
`);

export const submitNewReview = async (formData: FormData) => {
  const customerId = await getSessionCustomerId();
  console.log('customerId', customerId);

  try {
    const parsedData = ReviewSchema.parse(Object.fromEntries(formData.entries()));

    const req = {
      document: SubmitNewReviewMutation,
      customerId,
      variables: {
        input: {
          productEntityId: parseInt(parsedData.productEntityId, 10),
          review: {
            author: parsedData.author,
            email: parsedData.email,
            rating: parseInt(parsedData.rating, 10),
            text: parsedData.text,
            title: parsedData.title,
          },
        },
      },
    };

    console.log('req', req);
      
    const response = await client.fetch(req);

    console.log('response', response);
    if (!response.data) {
      return { status: 'error', error: response };
    }

    const result = response.data.catalog.addProductReview;
    if (result.errors && result.errors.length > 0) {
      return {
        status: 'error',
        error: result.errors.map((error: { message: string }) => error.message).join('\n'),
      };
    }

    return { status: 'success', data: parsedData };
  } catch (error: unknown) {
    if (error instanceof Error || error instanceof z.ZodError) {
      return { status: 'error', error: error.message };
    }
    return { status: 'error', error: 'An unknown error occurred' };
  }
};
