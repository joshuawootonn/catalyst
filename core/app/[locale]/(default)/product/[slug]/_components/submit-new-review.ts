'use server';

import { z } from 'zod';
import { client } from '~/client';
import { graphql } from '~/client/graphql';
import { getSessionCustomerAccessToken } from '~/auth';

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
  const customerAccessToken = await getSessionCustomerAccessToken();

  const parsedData = ReviewSchema.parse(Object.fromEntries(formData.entries()));

  const response = await client.fetch({
    document: SubmitNewReviewMutation,
    customerAccessToken,
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
  });

    console.log('response', response);

    return { status: 'success', data: response };
    
//   const result = response.data.catalog.addProductReview;

//   console.log('result', result);

//   if (result.errors.length === 0) {
//     return {
//       status: 'error',
//       error: result.errors.map((error: { message: string }) => error.message).join('\n'),
//     };
//   }

//   return { status: 'success', data: result };
};
