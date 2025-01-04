import { GraphQLClient } from './graphql-client';
import { DocumentDecoration } from './types';
import { getBackendUserAgent } from './utils/userAgent';

export const graphqlApiDomain: string =
  process.env.BIGCOMMERCE_GRAPHQL_API_DOMAIN ?? 'mybigcommerce.com';

export const adminApiHostname: string =
  process.env.BIGCOMMERCE_ADMIN_API_HOST ?? 'api.bigcommerce.com';

interface Config<FetcherRequestInit extends RequestInit = RequestInit> {
  storeHash: string;
  storefrontToken: string;
  xAuthToken: string;
  channelId?: string;
  platform?: string;
  backendUserAgentExtensions?: string;
  logger?: boolean;
  getChannelId?: (defaultChannelId: string) => Promise<string> | string;
  beforeRequest?: (
    fetchOptions?: FetcherRequestInit,
  ) => Promise<Partial<FetcherRequestInit> | undefined> | Partial<FetcherRequestInit> | undefined;
}

interface BigCommerceResponseError {
  message: string;
  locations: Array<{
    line: number;
    column: number;
  }>;
  path: string[];
}

interface BigCommerceResponse<T> {
  data: T;
  errors?: BigCommerceResponseError[];
}

class Client<FetcherRequestInit extends RequestInit = RequestInit> extends GraphQLClient {
  private backendUserAgent: string;
  private readonly defaultChannelId: string;
  private getChannelId: (defaultChannelId: string) => Promise<string> | string;
  private beforeRequest?: (
    fetchOptions?: FetcherRequestInit,
  ) => Promise<Partial<FetcherRequestInit> | undefined> | Partial<FetcherRequestInit> | undefined;
  private trustedProxySecret = process.env.BIGCOMMERCE_TRUSTED_PROXY_SECRET;

  constructor(private clientConfig: Config<FetcherRequestInit>) {
    if (!clientConfig.channelId) {
      throw new Error('Client configuration must include a channelId.');
    }

    const backendUserAgent = getBackendUserAgent(
      clientConfig.platform,
      clientConfig.backendUserAgentExtensions,
    );

    super({
      graphqlEndpoint: async () => await this.getGraphQLEndpoint(),
      logger: clientConfig.logger
        ? ({ type, name, duration, response }) => {
            const complexity = response.headers.get('x-bc-graphql-complexity');

            // eslint-disable-next-line no-console
            console.log(
              `[BigCommerce] ${type} ${name ?? 'anonymous'} - ${duration}ms - complexity ${complexity ?? 'unknown'}`,
            );
          }
        : undefined,
      defaultFetchOptions: {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${clientConfig.storefrontToken}`,
          'User-Agent': backendUserAgent,
          ...(process.env.BIGCOMMERCE_TRUSTED_PROXY_SECRET && {
            'X-BC-Trusted-Proxy-Secret': process.env.BIGCOMMERCE_TRUSTED_PROXY_SECRET,
          }),
        },
      },
    });

    this.defaultChannelId = clientConfig.channelId;
    this.backendUserAgent = backendUserAgent;
    this.getChannelId = clientConfig.getChannelId
      ? clientConfig.getChannelId
      : (defaultChannelId) => defaultChannelId;
    this.beforeRequest = clientConfig.beforeRequest;
  }

  async fetch<TResult, TVariables extends Record<string, unknown>>(config: {
    document: DocumentDecoration<TResult, TVariables>;
    variables: TVariables;
    customerAccessToken?: string;
    fetchOptions?: FetcherRequestInit;
    channelId?: string;
  }): Promise<BigCommerceResponse<TResult>> {
    const {
      document,
      variables,
      customerAccessToken,
      fetchOptions = {} as FetcherRequestInit,
      channelId,
    } = config;
    const { headers = {}, ...rest } = fetchOptions;

    const { headers: additionalFetchHeaders = {}, ...additionalFetchOptions } =
      (await this.beforeRequest?.(fetchOptions)) ?? {};

    const response = await super.fetch({
      document,
      variables,
      endpointOverride: channelId ? await this.getGraphQLEndpoint(channelId) : undefined,
      fetchOptions: {
        headers: {
          ...(customerAccessToken && { 'X-Bc-Customer-Access-Token': customerAccessToken }),
          ...additionalFetchHeaders,
          ...headers,
        },
        ...additionalFetchOptions,
        ...rest,
      },
    });

    return response as BigCommerceResponse<TResult>;
  }

  async fetchShippingZones() {
    const response = await fetch(
      `https://${adminApiHostname}/stores/${this.clientConfig.storeHash}/v2/shipping/zones`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Auth-Token': this.clientConfig.xAuthToken,
          'User-Agent': this.backendUserAgent,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Unable to get Shipping Zones: ${response.statusText}`);
    }

    return response.json() as Promise<unknown>;
  }

  async fetchSitemapIndex(channelId?: string): Promise<string> {
    const sitemapIndexUrl = `${await this.getCanonicalUrl(channelId)}/xmlsitemap.php`;

    const response = await fetch(sitemapIndexUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/xml',
        'Content-Type': 'application/xml',
        'User-Agent': this.backendUserAgent,
        ...(this.trustedProxySecret && { 'X-BC-Trusted-Proxy-Secret': this.trustedProxySecret }),
      },
    });

    if (!response.ok) {
      throw new Error(`Unable to get Sitemap Index: ${response.statusText}`);
    }

    return response.text();
  }

  private async getCanonicalUrl(channelId?: string) {
    const resolvedChannelId = channelId ?? (await this.getChannelId(this.defaultChannelId));

    return `https://store-${this.clientConfig.storeHash}-${resolvedChannelId}.${graphqlApiDomain}`;
  }

  private async getGraphQLEndpoint(channelId?: string) {
    return `${await this.getCanonicalUrl(channelId)}/graphql`;
  }
}

export function createClient<FetcherRequestInit extends RequestInit = RequestInit>(
  config: Config<FetcherRequestInit>,
) {
  return new Client<FetcherRequestInit>(config);
}
