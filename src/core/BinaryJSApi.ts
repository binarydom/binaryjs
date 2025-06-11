import { BinaryDOMNode } from "binarydom";
import { BinaryJSFetch, FetchConfig, FetchResponse } from "./BinaryJSFetch";

/**
 * Represents an API endpoint configuration
 */
export interface ApiEndpoint {
  path: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  cache?: {
    enabled: boolean;
    ttl?: number;
  };
  retry?: {
    attempts: number;
    delay: number;
    backoff: "linear" | "exponential";
  };
  validation?: {
    request?: (data: any) => boolean;
    response?: (data: any) => boolean;
  };
  transform?: {
    request?: (data: any) => any;
    response?: (data: any) => any;
  };
}

/**
 * Represents an API service configuration
 */
export interface ApiServiceConfig {
  baseUrl: string;
  defaultHeaders?: Record<string, string>;
  endpoints: Record<string, ApiEndpoint>;
  interceptors?: {
    request?: Array<(config: RequestInit) => RequestInit>;
    response?: Array<(response: Response) => Promise<Response>>;
  };
  errorHandlers?: Array<(error: Error) => void>;
}

/**
 * Represents the state of an API request
 */
export interface ApiRequestState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  timestamp: number;
  metadata: {
    cacheHit: boolean;
    retryCount: number;
    duration: number;
  };
}

/**
 * Base class for API event listeners
 */
export abstract class ApiEventListener {
  abstract onRequestStart(endpoint: string, data?: any): void;
  abstract onRequestSuccess<T>(
    endpoint: string,
    response: FetchResponse<T>
  ): void;
  abstract onRequestError(endpoint: string, error: Error): void;
  abstract onRequestComplete(endpoint: string): void;
}

/**
 * Core API handling system for BinaryJS
 */
export class BinaryJSApi {
  private static instance: BinaryJSApi;
  private fetch: BinaryJSFetch;
  private config: ApiServiceConfig;
  private listeners: Set<ApiEventListener> = new Set();
  private requestStates: Map<string, ApiRequestState<any>> = new Map();

  private constructor(config: ApiServiceConfig) {
    this.config = config;
    this.fetch = BinaryJSFetch.getInstance();
    this.initializeInterceptors();
  }

  static getInstance(config?: ApiServiceConfig): BinaryJSApi {
    if (!BinaryJSApi.instance && config) {
      BinaryJSApi.instance = new BinaryJSApi(config);
    }
    return BinaryJSApi.instance;
  }

  private initializeInterceptors(): void {
    if (this.config.interceptors) {
      // Initialize request interceptors
      if (this.config.interceptors.request) {
        this.config.interceptors.request.forEach((interceptor) => {
          // Apply interceptors to fetch configuration
        });
      }

      // Initialize response interceptors
      if (this.config.interceptors.response) {
        this.config.interceptors.response.forEach((interceptor) => {
          // Apply interceptors to response handling
        });
      }
    }
  }

  addEventListener(listener: ApiEventListener): void {
    this.listeners.add(listener);
  }

  removeEventListener(listener: ApiEventListener): void {
    this.listeners.delete(listener);
  }

  private notifyRequestStart(endpoint: string, data?: any): void {
    this.listeners.forEach((listener) =>
      listener.onRequestStart(endpoint, data)
    );
  }

  private notifyRequestSuccess<T>(
    endpoint: string,
    response: FetchResponse<T>
  ): void {
    this.listeners.forEach((listener) =>
      listener.onRequestSuccess(endpoint, response)
    );
  }

  private notifyRequestError(endpoint: string, error: Error): void {
    this.listeners.forEach((listener) =>
      listener.onRequestError(endpoint, error)
    );
    this.config.errorHandlers?.forEach((handler) => handler(error));
  }

  private notifyRequestComplete(endpoint: string): void {
    this.listeners.forEach((listener) => listener.onRequestComplete(endpoint));
  }

  private updateRequestState<T>(
    endpoint: string,
    state: Partial<ApiRequestState<T>>
  ): void {
    const currentState = this.requestStates.get(endpoint) || {
      data: null,
      loading: false,
      error: null,
      timestamp: Date.now(),
      metadata: {
        cacheHit: false,
        retryCount: 0,
        duration: 0,
      },
    };

    this.requestStates.set(endpoint, { ...currentState, ...state });
  }

  async request<T>(
    endpoint: string,
    data?: any,
    options: Partial<ApiEndpoint> = {}
  ): Promise<FetchResponse<T>> {
    const endpointConfig = { ...this.config.endpoints[endpoint], ...options };
    if (!endpointConfig) {
      throw new Error(`Endpoint ${endpoint} not configured`);
    }

    this.updateRequestState(endpoint, { loading: true });
    this.notifyRequestStart(endpoint, data);

    try {
      const url = `${this.config.baseUrl}${endpointConfig.path}`;
      const headers = {
        ...this.config.defaultHeaders,
        ...endpointConfig.headers,
      };

      const fetchConfig: FetchConfig = {
        cache: endpointConfig.cache,
        retry: endpointConfig.retry,
        headers,
      };

      let requestData = data;
      if (endpointConfig.transform?.request) {
        requestData = endpointConfig.transform.request(data);
      }

      if (
        endpointConfig.validation?.request &&
        !endpointConfig.validation.request(requestData)
      ) {
        throw new Error("Request validation failed");
      }

      const response = await this.fetch.fetch<T>(
        url,
        {
          method: endpointConfig.method,
          headers,
          body: requestData ? JSON.stringify(requestData) : undefined,
        },
        fetchConfig
      );

      if (endpointConfig.transform?.response) {
        response.data = endpointConfig.transform.response(response.data);
      }

      if (
        endpointConfig.validation?.response &&
        !endpointConfig.validation.response(response.data)
      ) {
        throw new Error("Response validation failed");
      }

      this.updateRequestState(endpoint, {
        data: response.data,
        loading: false,
        error: null,
        timestamp: Date.now(),
        metadata: {
          cacheHit: response.metadata.cacheHit,
          retryCount: response.metadata.retryCount,
          duration: response.metadata.duration,
        },
      });

      this.notifyRequestSuccess(endpoint, response);
      return response;
    } catch (error) {
      this.updateRequestState(endpoint, {
        loading: false,
        error: error as Error,
      });
      this.notifyRequestError(endpoint, error as Error);
      throw error;
    } finally {
      this.notifyRequestComplete(endpoint);
    }
  }

  getRequestState<T>(endpoint: string): ApiRequestState<T> | undefined {
    return this.requestStates.get(endpoint);
  }

  clearRequestState(endpoint: string): void {
    this.requestStates.delete(endpoint);
  }

  clearAllRequestStates(): void {
    this.requestStates.clear();
  }
}

/**
 * Base class for API-aware components
 */
export abstract class ApiComponent {
  protected api: BinaryJSApi;
  protected state: Map<string, any> = new Map();
  protected listeners: Set<() => void> = new Set();

  constructor(apiConfig: ApiServiceConfig) {
    this.api = BinaryJSApi.getInstance(apiConfig);
    this.initializeApiListener();
  }

  protected abstract onApiUpdate(): void;

  private initializeApiListener(): void {
    const listener = new (class extends ApiEventListener {
      constructor(private component: ApiComponent) {
        super();
      }

      onRequestStart(endpoint: string, data?: any): void {
        this.component.setState("loading", true);
      }

      onRequestSuccess<T>(endpoint: string, response: FetchResponse<T>): void {
        this.component.setState("data", response.data);
        this.component.setState("loading", false);
        this.component.onApiUpdate();
      }

      onRequestError(endpoint: string, error: Error): void {
        this.component.setState("error", error);
        this.component.setState("loading", false);
        this.component.onApiUpdate();
      }

      onRequestComplete(endpoint: string): void {
        // Handle request completion if needed
      }
    })(this);

    this.api.addEventListener(listener);
  }

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

  async request<T>(
    endpoint: string,
    data?: any,
    options: Partial<ApiEndpoint> = {}
  ): Promise<void> {
    await this.api.request<T>(endpoint, data, options);
  }
}

/**
 * Example usage:
 *
 * const apiConfig: ApiServiceConfig = {
 *   baseUrl: 'https://api.example.com',
 *   defaultHeaders: {
 *     'Content-Type': 'application/json'
 *   },
 *   endpoints: {
 *     getUser: {
 *       path: '/users/:id',
 *       method: 'GET',
 *       cache: {
 *         enabled: true,
 *         ttl: 5000
 *       }
 *     },
 *     updateUser: {
 *       path: '/users/:id',
 *       method: 'PUT',
 *       validation: {
 *         request: (data) => data.name && data.email,
 *         response: (data) => data.id && data.name
 *       }
 *     }
 *   }
 * };
 *
 * class UserProfileComponent extends ApiComponent {
 *   constructor() {
 *     super(apiConfig);
 *     this.loadUserData();
 *   }
 *
 *   protected onApiUpdate(): void {
 *     const userData = this.getState('data');
 *     const loading = this.getState('loading');
 *     const error = this.getState('error');
 *     // Update UI or perform other actions
 *   }
 *
 *   async loadUserData(): Promise<void> {
 *     await this.request<UserData>('getUser', { id: 123 });
 *   }
 *
 *   async updateUser(userData: Partial<UserData>): Promise<void> {
 *     await this.request<UserData>('updateUser', userData);
 *   }
 * }
 */
