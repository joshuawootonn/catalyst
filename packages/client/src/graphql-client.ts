import { DocumentDecoration } from './types';
import { getOperationInfo } from './utils/getOperationName';
import { normalizeQuery } from './utils/normalizeQuery';

interface GraphQLError {
  message: string;
  locations?: Array<{ line: number; column: number }>;
  path?: Array<string | number>;
  extensions?: Record<string, unknown>;
}

interface GraphQLResponse<TData = unknown> {
  data?: TData | null;
  errors?: GraphQLError[];
  extensions?: Record<string, unknown>;
}

interface Config {
  graphqlEndpoint: () => Promise<string> | string;
  defaultFetchOptions?: RequestInit;
  logger?: (info: {
    type: string;
    name: string | undefined;
    duration: number;
    response: Response;
  }) => void;
}

export class GraphQLClient {
  constructor(private config: Config) {
    this.config = config;
  }

  // Overload for documents that require variables
  async fetch<TResult, TVariables extends Record<string, unknown>>(config: {
    document: DocumentDecoration<TResult, TVariables>;
    variables: TVariables;
    fetchOptions?: RequestInit;
    endpointOverride?: string;
  }): Promise<GraphQLResponse<TResult>>;

  // Overload for documents that do not require variables
  async fetch<TResult>(config: {
    document: DocumentDecoration<TResult, Record<string, never>>;
    variables?: undefined;
    fetchOptions?: RequestInit;
    endpointOverride?: string;
  }): Promise<GraphQLResponse<TResult>>;

  async fetch<TResult, TVariables>({
    document,
    variables,
    fetchOptions = {} as RequestInit,
    endpointOverride,
  }: {
    document: DocumentDecoration<TResult, TVariables>;
    variables?: TVariables;
    fetchOptions?: RequestInit;
    endpointOverride?: string;
  }): Promise<GraphQLResponse<TResult>> {
    const endpoint =
      endpointOverride ??
      (typeof this.config.graphqlEndpoint === 'function'
        ? await this.config.graphqlEndpoint()
        : this.config.graphqlEndpoint);

    const { headers: defaultHeaders = {}, ...defaultRest } = this.config.defaultFetchOptions ?? {};
    const { headers = {}, ...rest } = fetchOptions;

    const query = normalizeQuery(document);

    const log = this.requestLogger(query);

    const response = await fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        query,
        ...(variables && { variables }),
      }),
      headers: {
        ...defaultHeaders,
        ...headers,
      },
      ...defaultRest,
      ...rest,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch from ${endpoint}: ${response.statusText}`);
    }

    log(response);

    return response.json() as Promise<GraphQLResponse<TResult>>;
  }

  private requestLogger(document: string) {
    const logger = this.config.logger;

    if (!logger) {
      return () => {
        // noop
      };
    }

    const { name, type } = getOperationInfo(document);
    const timeStart = Date.now();

    return (response: Response) => {
      const timeEnd = Date.now();
      const duration = timeEnd - timeStart;
      const clone = response.clone();

      logger({ type, name, duration, response: clone });
    };
  }
}

export const createGraphQLClient = (config: Config) => new GraphQLClient(config);
