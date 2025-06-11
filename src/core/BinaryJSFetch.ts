import { BinaryDOMNode } from "binarydom";

/**
 * Configuration options for BinaryJSFetch
 */
export interface FetchConfig {
  cache?: {
    enabled: boolean;
    ttl?: number;
    strategy?: "memory" | "localStorage" | "sessionStorage";
  };
  retry?: {
    attempts: number;
    delay: number;
    backoff: "linear" | "exponential";
  };
  timeout?: number;
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
  mode?: RequestMode;
  priority?: "high" | "low" | "auto";
  prefetch?: boolean;
}

/**
 * Response wrapper with additional metadata
 */
export interface FetchResponse<T> {
  data: T;
  metadata: {
    timestamp: number;
    cacheHit: boolean;
    retryCount: number;
    duration: number;
    size: number;
  };
}

/**
 * Base class for fetch event listeners
 */
export abstract class FetchEventListener {
  abstract onFetchStart(url: string): void;
  abstract onFetchSuccess<T>(response: FetchResponse<T>): void;
  abstract onFetchError(error: Error): void;
}

/**
 * Core data fetching system for BinaryJS
 */
export class BinaryJSFetch {
  private static instance: BinaryJSFetch;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private pendingRequests: Map<string, Promise<any>> = new Map();
  private requestQueue: Array<() => Promise<void>> = [];
  private listeners: Set<FetchEventListener> = new Set();
  private defaultConfig: FetchConfig = {
    cache: {
      enabled: true,
      ttl: 5000,
      strategy: "memory",
    },
    retry: {
      attempts: 3,
      delay: 1000,
      backoff: "exponential",
    },
    timeout: 30000,
    priority: "auto",
  };

  private constructor() {
    this.initializeCache();
  }

  static getInstance(): BinaryJSFetch {
    if (!BinaryJSFetch.instance) {
      BinaryJSFetch.instance = new BinaryJSFetch();
    }
    return BinaryJSFetch.instance;
  }

  addEventListener(listener: FetchEventListener): void {
    this.listeners.add(listener);
  }

  removeEventListener(listener: FetchEventListener): void {
    this.listeners.delete(listener);
  }

  private notifyFetchStart(url: string): void {
    this.listeners.forEach((listener) => listener.onFetchStart(url));
  }

  private notifyFetchSuccess<T>(response: FetchResponse<T>): void {
    this.listeners.forEach((listener) => listener.onFetchSuccess(response));
  }

  private notifyFetchError(error: Error): void {
    this.listeners.forEach((listener) => listener.onFetchError(error));
  }

  private initializeCache() {
    if (typeof window !== "undefined") {
      // Initialize cache from localStorage if available
      try {
        const cached = localStorage.getItem("binaryjs_fetch_cache");
        if (cached) {
          const parsed = JSON.parse(cached);
          Object.entries(parsed).forEach(([key, value]: [string, any]) => {
            this.cache.set(key, value);
          });
        }
      } catch (e) {
        console.warn("Failed to initialize cache from localStorage:", e);
      }
    }
  }

  private async persistCache() {
    if (typeof window !== "undefined") {
      try {
        const cacheObj = Object.fromEntries(this.cache);
        localStorage.setItem("binaryjs_fetch_cache", JSON.stringify(cacheObj));
      } catch (e) {
        console.warn("Failed to persist cache to localStorage:", e);
      }
    }
  }

  private calculateBackoff(attempt: number, config: FetchConfig): number {
    const { delay, backoff } = config.retry!;
    return backoff === "exponential"
      ? delay * Math.pow(2, attempt - 1)
      : delay * attempt;
  }

  private async executeRequest<T>(
    url: string,
    options: RequestInit,
    config: FetchConfig
  ): Promise<FetchResponse<T>> {
    const startTime = Date.now();
    let retryCount = 0;

    while (retryCount <= (config.retry?.attempts || 0)) {
      try {
        this.notifyFetchStart(url);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const endTime = Date.now();

        const fetchResponse: FetchResponse<T> = {
          data,
          metadata: {
            timestamp: endTime,
            cacheHit: false,
            retryCount,
            duration: endTime - startTime,
            size: JSON.stringify(data).length,
          },
        };

        this.notifyFetchSuccess(fetchResponse);
        return fetchResponse;
      } catch (error) {
        if (retryCount === config.retry?.attempts) {
          this.notifyFetchError(error as Error);
          throw error;
        }

        retryCount++;
        const backoff = this.calculateBackoff(retryCount, config);
        await new Promise((resolve) => setTimeout(resolve, backoff));
      }
    }

    throw new Error("Max retries exceeded");
  }

  async fetch<T>(
    url: string,
    options: RequestInit = {},
    config: Partial<FetchConfig> = {}
  ): Promise<FetchResponse<T>> {
    const mergedConfig = { ...this.defaultConfig, ...config };
    const cacheKey = `${url}:${JSON.stringify(options)}`;

    // Check cache if enabled
    if (mergedConfig.cache?.enabled) {
      const cached = this.cache.get(cacheKey);
      if (
        cached &&
        (!mergedConfig.cache.ttl ||
          Date.now() - cached.timestamp < mergedConfig.cache.ttl)
      ) {
        const response: FetchResponse<T> = {
          data: cached.data,
          metadata: {
            timestamp: cached.timestamp,
            cacheHit: true,
            retryCount: 0,
            duration: 0,
            size: JSON.stringify(cached.data).length,
          },
        };
        this.notifyFetchSuccess(response);
        return response;
      }
    }

    // Check for pending requests
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }

    // Execute request
    const request = this.executeRequest<T>(url, options, mergedConfig).then(
      (response) => {
        if (mergedConfig.cache?.enabled) {
          this.cache.set(cacheKey, {
            data: response.data,
            timestamp: response.metadata.timestamp,
          });
          this.persistCache();
        }
        this.pendingRequests.delete(cacheKey);
        return response;
      }
    );

    this.pendingRequests.set(cacheKey, request);
    return request;
  }

  async prefetch<T>(
    url: string,
    options: RequestInit = {},
    config: Partial<FetchConfig> = {}
  ): Promise<void> {
    const mergedConfig = {
      ...this.defaultConfig,
      ...config,
      priority: "low" as const,
    };
    this.requestQueue.push(async () => {
      await this.fetch<T>(url, options, mergedConfig);
    });
  }

  async flushQueue(): Promise<void> {
    await Promise.all(this.requestQueue.map((fn) => fn()));
    this.requestQueue = [];
  }

  clearCache(): void {
    this.cache.clear();
    if (typeof window !== "undefined") {
      localStorage.removeItem("binaryjs_fetch_cache");
    }
  }
}

/**
 * Base class for components that need data fetching capabilities
 */
export abstract class FetchableComponent {
  protected fetch: BinaryJSFetch;
  protected state: Map<string, any> = new Map();
  protected listeners: Set<() => void> = new Set();

  constructor() {
    this.fetch = BinaryJSFetch.getInstance();
    this.initializeFetchListener();
  }

  protected abstract onDataUpdate(): void;

  private initializeFetchListener(): void {
    const listener = new (class extends FetchEventListener {
      constructor(private component: FetchableComponent) {
        super();
      }

      onFetchStart(url: string): void {
        this.component.setState("loading", true);
      }

      onFetchSuccess<T>(response: FetchResponse<T>): void {
        this.component.setState("data", response.data);
        this.component.setState("loading", false);
        this.component.onDataUpdate();
      }

      onFetchError(error: Error): void {
        this.component.setState("error", error);
        this.component.setState("loading", false);
        this.component.onDataUpdate();
      }
    })(this);

    this.fetch.addEventListener(listener);
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

  async fetchData<T>(
    url: string,
    options: RequestInit = {},
    config: Partial<FetchConfig> = {}
  ): Promise<void> {
    await this.fetch.fetch<T>(url, options, config);
  }
}
