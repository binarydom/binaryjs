import { BinaryDOMNode } from "binarydom";
import {
  BinaryJSApi,
  ApiEndpoint,
  ApiServiceConfig,
  ApiRequestState,
} from "./BinaryJSApi";

/**
 * Represents a query configuration for the API Client
 */
export interface QueryConfig {
  enabled: boolean;
  staleTime?: number;
  refetchInterval?: number;
  refetchOnWindowFocus?: boolean;
  retryOnError?: boolean;
  dedupeTime?: number;
}

/**
 * Represents a mutation configuration for the API Client
 */
export interface MutationConfig {
  optimisticUpdate?: boolean;
  rollbackOnError?: boolean;
  retryOnError?: boolean;
  invalidateQueries?: string[];
}

/**
 * Represents the state of a query
 */
export interface QueryState<T> extends ApiRequestState<T> {
  isStale: boolean;
  lastUpdated: number;
  refetchCount: number;
}

/**
 * Core API Client for BinaryJS with advanced features
 */
export class BinaryJSApiClient {
  private static instance: BinaryJSApiClient;
  private api: BinaryJSApi;
  private queryCache: Map<string, QueryState<any>> = new Map();
  private mutationQueue: Array<() => Promise<void>> = [];
  private focusListener?: () => void;
  private defaultQueryConfig: QueryConfig = {
    enabled: true,
    staleTime: 5000,
    refetchInterval: 0,
    refetchOnWindowFocus: true,
    retryOnError: true,
    dedupeTime: 1000,
  };

  public static getInstance(): BinaryJSApiClient {
    if (!BinaryJSApiClient.instance) {
      BinaryJSApiClient.instance = new BinaryJSApiClient();
    }
    return BinaryJSApiClient.instance;
  }

  public constructor() {
    this.api = BinaryJSApi.getInstance();
    this.initializeFocusListener();
  }

  private initializeFocusListener(): void {
    if (typeof window !== "undefined") {
      this.focusListener = () => {
        this.refetchStaleQueries();
      };
      window.addEventListener("focus", this.focusListener);
    }
  }

  private async refetchStaleQueries(): Promise<void> {
    const now = Date.now();
    const refetchPromises: Promise<void>[] = [];

    this.queryCache.forEach((state, key) => {
      if (state.isStale && this.defaultQueryConfig.refetchOnWindowFocus) {
        const [endpoint] = key.split(":");
        refetchPromises.push(this.query(endpoint).then(() => {}));
      }
    });

    await Promise.all(refetchPromises);
  }

  private updateQueryState<T>(
    key: string,
    update: Partial<QueryState<T>>
  ): void {
    const currentState = this.queryCache.get(key) || {
      data: null,
      loading: false,
      error: null,
      timestamp: Date.now(),
      metadata: {
        cacheHit: false,
        retryCount: 0,
        duration: 0,
      },
      isStale: true,
      lastUpdated: 0,
      refetchCount: 0,
    };

    this.queryCache.set(key, { ...currentState, ...update });
  }

  async query<T>(
    endpoint: string,
    data?: any,
    config: Partial<QueryConfig> = {}
  ): Promise<QueryState<T>> {
    const queryKey = `${endpoint}:${JSON.stringify(data)}`;
    const mergedConfig = { ...this.defaultQueryConfig, ...config };
    const currentState = this.queryCache.get(queryKey);

    // Check if query is enabled
    if (!mergedConfig.enabled) {
      return currentState as QueryState<T>;
    }

    // Check if we should dedupe the request
    if (
      currentState &&
      !currentState.isStale &&
      mergedConfig.dedupeTime &&
      Date.now() - currentState.lastUpdated < mergedConfig.dedupeTime
    ) {
      return currentState as QueryState<T>;
    }

    this.updateQueryState(queryKey, { loading: true });

    try {
      const response = await this.api.request<T>(endpoint, data);

      this.updateQueryState(queryKey, {
        data: response.data,
        loading: false,
        error: null,
        isStale: false,
        lastUpdated: Date.now(),
        refetchCount: (currentState?.refetchCount || 0) + 1,
        metadata: response.metadata,
      });

      // Set up refetch interval if configured
      if (mergedConfig.refetchInterval) {
        setTimeout(() => {
          this.updateQueryState(queryKey, { isStale: true });
        }, mergedConfig.refetchInterval);
      }

      return this.queryCache.get(queryKey) as QueryState<T>;
    } catch (error) {
      this.updateQueryState(queryKey, {
        loading: false,
        error: error as Error,
        isStale: true,
      });
      throw error;
    }
  }

  async mutate<T>(
    endpoint: string,
    data: any,
    config: Partial<MutationConfig> = {}
  ): Promise<T> {
    const optimisticUpdate = config.optimisticUpdate;
    const invalidateQueries = config.invalidateQueries || [];

    if (optimisticUpdate) {
      // Perform optimistic update
      this.queryCache.forEach((state, key) => {
        if (invalidateQueries.some((query) => key.startsWith(query))) {
          this.updateQueryState(key, { isStale: true });
        }
      });
    }

    try {
      const response = await this.api.request<T>(endpoint, data);

      // Invalidate affected queries
      invalidateQueries.forEach((query) => {
        this.queryCache.forEach((state, key) => {
          if (key.startsWith(query)) {
            this.updateQueryState(key, { isStale: true });
          }
        });
      });

      return response.data;
    } catch (error) {
      if (config.rollbackOnError) {
        // Rollback optimistic updates
        this.queryCache.forEach((state, key) => {
          if (invalidateQueries.some((query) => key.startsWith(query))) {
            this.updateQueryState(key, { isStale: true });
          }
        });
      }
      throw error;
    }
  }

  getQueryState<T>(endpoint: string, data?: any): QueryState<T> | undefined {
    const queryKey = `${endpoint}:${JSON.stringify(data)}`;
    return this.queryCache.get(queryKey);
  }

  invalidateQuery(endpoint: string): void {
    this.queryCache.forEach((state, key) => {
      if (key.startsWith(endpoint)) {
        this.updateQueryState(key, { isStale: true });
      }
    });
  }

  clearQueryCache(): void {
    this.queryCache.clear();
  }

  dispose(): void {
    if (this.focusListener && typeof window !== "undefined") {
      window.removeEventListener("focus", this.focusListener);
    }
  }
}

/**
 * Base class for API-aware components with query support
 */
export abstract class QueryComponent {
  protected client: BinaryJSApiClient;
  protected state: Map<string, any> = new Map();
  protected listeners: Set<() => void> = new Set();

  constructor(apiConfig: ApiServiceConfig) {
    this.client = BinaryJSApiClient.getInstance();
  }

  protected abstract onQueryUpdate(): void;

  protected setState(key: string, value: any): void {
    this.state.set(key, value);
    this.notifyListeners();
  }

  protected getState(key: string): any {
    return this.state.get(key);
  }

  protected addListener(listener: () => void): void {
    this.listeners.add(listener);
  }

  protected removeListener(listener: () => void): void {
    this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener());
  }

  async query<T>(
    endpoint: string,
    data?: any,
    config: Partial<QueryConfig> = {}
  ): Promise<void> {
    try {
      const queryState = await this.client.query<T>(endpoint, data, config);
      this.setState("data", queryState.data);
      this.setState("loading", queryState.loading);
      this.setState("error", queryState.error);
      this.onQueryUpdate();
    } catch (error) {
      this.setState("error", error);
      this.onQueryUpdate();
    }
  }

  async mutate<T>(
    endpoint: string,
    data: any,
    config: Partial<MutationConfig> = {}
  ): Promise<T> {
    return this.client.mutate<T>(endpoint, data, config);
  }
}

/**
 * Example usage:
 *
 * const apiConfig: ApiServiceConfig = {
 *   baseUrl: 'https://api.example.com',
 *   endpoints: {
 *     getUser: {
 *       path: '/users/:id',
 *       method: 'GET'
 *     },
 *     updateUser: {
 *       path: '/users/:id',
 *       method: 'PUT'
 *     }
 *   }
 * };
 *
 * class UserProfileComponent extends QueryComponent {
 *   constructor() {
 *     super(apiConfig);
 *     this.loadUserData();
 *   }
 *
 *   protected onQueryUpdate(): void {
 *     const userData = this.getState('data');
 *     const loading = this.getState('loading');
 *     const error = this.getState('error');
 *     // Update UI
 *   }
 *
 *   async loadUserData(): Promise<void> {
 *     await this.query<UserData>('getUser', { id: 123 }, {
 *       refetchInterval: 30000,
 *       refetchOnWindowFocus: true
 *     });
 *   }
 *
 *   async updateUser(userData: Partial<UserData>): Promise<void> {
 *     await this.mutate<UserData>('updateUser', userData, {
 *       optimisticUpdate: true,
 *       invalidateQueries: ['getUser']
 *     });
 *   }
 * }
 */
