import { createGraphQLClient } from '@bigcommerce/catalyst-client';
import { NextResponse } from 'next/server';

import { graphql } from '~/client/graphql';

export const GET = async () => {
  const customClient = createGraphQLClient({
    graphqlEndpoint: () =>
      `https://store-${process.env.BIGCOMMERCE_STORE_HASH}-${process.env.BIGCOMMERCE_CHANNEL_ID}.mybigcommerce.com/graphql`,
    defaultFetchOptions: {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.BIGCOMMERCE_STOREFRONT_TOKEN}`,
      },
    },
    logger: (info) => {
      const complexity = info.response.headers.get('x-bc-graphql-complexity');

      // eslint-disable-next-line no-console
      console.log(
        `[MY_CUSTOM_CLIENT] ${info.type} ${info.name ?? 'anonymous'} - ${info.duration}ms - complexity ${complexity ?? 'unknown'}`,
      );
    },
  });

  const result = await customClient.fetch({
    document: graphql(`
      query GetStoreName {
        site {
          settings {
            storeName
          }
        }
      }
    `),
  });

  const storeName = result.data?.site.settings?.storeName;

  return NextResponse.json({ storeName });
};
