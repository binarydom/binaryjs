import { BinaryDOMNode } from "binarydom";

/**
 * Configuration for lazy loading behavior
 */
interface LazyLoadConfig {
  threshold?: number; // Intersection observer threshold
  rootMargin?: string; // Intersection observer root margin
  preload?: boolean; // Whether to preload the component
  placeholder?: BinaryDOMNode; // Placeholder node while loading
  errorFallback?: BinaryDOMNode; // Fallback node for errors
  retryCount?: number; // Number of retry attempts
  retryDelay?: number; // Delay between retries in ms
}

/**
 * State of a lazy loaded component
 */
interface LazyLoadState {
  isLoaded: boolean;
  isLoading: boolean;
  hasError: boolean;
  error?: Error;
  retryCount: number;
}

/**
 * Event listener for lazy loading events
 */
abstract class LazyLoadEventListener {
  abstract onLoadStart(componentId: string): void;
  abstract onLoadSuccess(componentId: string): void;
  abstract onLoadError(componentId: string, error: Error): void;
  abstract onVisibilityChange(componentId: string, isVisible: boolean): void;
}

/**
 * Core lazy loading system with advanced features
 */
export class BinaryJSLazyLoader {
  private static instance: BinaryJSLazyLoader;
  private observers: Map<string, IntersectionObserver> = new Map();
  private componentCache: Map<string, any> = new Map();
  private loadStates: Map<string, LazyLoadState> = new Map();
  private listeners: Set<LazyLoadEventListener> = new Set();
  private defaultConfig: LazyLoadConfig = {
    threshold: 0.1,
    rootMargin: "50px",
    preload: false,
    retryCount: 3,
    retryDelay: 1000,
  };

  private constructor() {}

  static getInstance(): BinaryJSLazyLoader {
    if (!BinaryJSLazyLoader.instance) {
      BinaryJSLazyLoader.instance = new BinaryJSLazyLoader();
    }
    return BinaryJSLazyLoader.instance;
  }

  addListener(listener: LazyLoadEventListener): void {
    this.listeners.add(listener);
  }

  removeListener(listener: LazyLoadEventListener): void {
    this.listeners.delete(listener);
  }

  private notifyListeners(
    event: keyof LazyLoadEventListener,
    ...args: any[]
  ): void {
    this.listeners.forEach((listener) => {
      const handler = listener[event];
      if (typeof handler === "function") {
        (handler as Function).apply(listener, args);
      }
    });
  }

  /**
   * Register a component for lazy loading
   */
  async registerComponent(
    componentId: string,
    loader: () => Promise<any>,
    config: LazyLoadConfig = {}
  ): Promise<void> {
    const mergedConfig = { ...this.defaultConfig, ...config };
    const state: LazyLoadState = {
      isLoaded: false,
      isLoading: false,
      hasError: false,
      retryCount: 0,
    };

    this.loadStates.set(componentId, state);

    if (mergedConfig.preload) {
      await this.loadComponent(componentId, loader, mergedConfig);
    } else {
      this.setupIntersectionObserver(componentId, loader, mergedConfig);
    }
  }

  /**
   * Load a component with retry mechanism
   */
  private async loadComponent(
    componentId: string,
    loader: () => Promise<any>,
    config: LazyLoadConfig
  ): Promise<void> {
    const state = this.loadStates.get(componentId);
    if (!state || state.isLoaded || state.isLoading) return;

    state.isLoading = true;
    this.notifyListeners("onLoadStart", componentId);

    try {
      const component = await loader();
      this.componentCache.set(componentId, component);
      state.isLoaded = true;
      state.isLoading = false;
      this.notifyListeners("onLoadSuccess", componentId);
    } catch (error) {
      state.hasError = true;
      state.error = error as Error;
      state.isLoading = false;

      if (state.retryCount < (config.retryCount || 0)) {
        state.retryCount++;
        setTimeout(() => {
          this.loadComponent(componentId, loader, config);
        }, config.retryDelay);
      } else {
        this.notifyListeners("onLoadError", componentId, error as Error);
      }
    }
  }

  /**
   * Setup intersection observer for lazy loading
   */
  private setupIntersectionObserver(
    componentId: string,
    loader: () => Promise<any>,
    config: LazyLoadConfig
  ): void {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const isVisible = entry.isIntersecting;
          this.notifyListeners("onVisibilityChange", componentId, isVisible);

          if (isVisible) {
            this.loadComponent(componentId, loader, config);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: config.threshold,
        rootMargin: config.rootMargin,
      }
    );

    this.observers.set(componentId, observer);
  }

  /**
   * Get a lazy loaded component
   */
  getComponent(componentId: string): any {
    return this.componentCache.get(componentId);
  }

  /**
   * Get the loading state of a component
   */
  getLoadState(componentId: string): LazyLoadState | undefined {
    return this.loadStates.get(componentId);
  }

  /**
   * Preload a component
   */
  async preloadComponent(componentId: string): Promise<void> {
    const state = this.loadStates.get(componentId);
    if (state && !state.isLoaded && !state.isLoading) {
      const loader = this.componentCache.get(componentId);
      if (loader) {
        await this.loadComponent(componentId, loader, this.defaultConfig);
      }
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers.clear();
    this.componentCache.clear();
    this.loadStates.clear();
    this.listeners.clear();
  }
}

/**
 * Base class for lazy loadable components
 */
export abstract class LazyLoadableComponent {
  protected lazyLoader: BinaryJSLazyLoader;
  protected componentId: string;
  protected config: LazyLoadConfig;

  constructor(componentId: string, config: LazyLoadConfig = {}) {
    this.lazyLoader = BinaryJSLazyLoader.getInstance();
    this.componentId = componentId;
    this.config = config;
  }

  abstract load(): Promise<any>;
  abstract render(): Promise<BinaryDOMNode>;

  async initialize(): Promise<void> {
    await this.lazyLoader.registerComponent(
      this.componentId,
      () => this.load(),
      this.config
    );
  }

  getState(): LazyLoadState | undefined {
    return this.lazyLoader.getLoadState(this.componentId);
  }

  async preload(): Promise<void> {
    await this.lazyLoader.preloadComponent(this.componentId);
  }
}

/**
 * Example usage of the lazy loading system
 */
class UserProfileComponent extends LazyLoadableComponent {
  constructor() {
    super("user-profile", {
      threshold: 0.5,
      rootMargin: "100px",
      preload: true,
      retryCount: 3,
      retryDelay: 1000,
      placeholder: {
        type: "element",
        tagName: "div",
        id: "loading-placeholder",
        props: {
          className: "loading-placeholder",
          children: [
            {
              type: "text",
              id: "loading-text",
              value: "Loading user profile...",
              props: {},
              attributes: new Map(),
              children: [],
              left: null,
              right: null,
              checksum: 0,
              isDirty: false,
              parent: null,
              eventHandlers: new Map(),
              state: null,
              hooks: [],
            },
          ],
        },
        attributes: new Map(),
        children: [],
        left: null,
        right: null,
        checksum: 0,
        isDirty: false,
        parent: null,
        eventHandlers: new Map(),
        state: null,
        hooks: [],
      },
    });
  }

  async load(): Promise<any> {
    const response = await fetch("https://api.example.com/user");
    return response.json();
  }

  async render(): Promise<BinaryDOMNode> {
    const state = this.getState();
    if (!state?.isLoaded) {
      return this.config.placeholder!;
    }

    const userData = this.lazyLoader.getComponent(this.componentId);
    return {
      type: "element",
      tagName: "div",
      id: "user-profile-content",
      props: {
        className: "user-profile",
        children: [
          {
            type: "text",
            id: "user-name",
            value: userData.name,
            props: {},
            attributes: new Map(),
            children: [],
            left: null,
            right: null,
            checksum: 0,
            isDirty: false,
            parent: null,
            eventHandlers: new Map(),
            state: null,
            hooks: [],
          },
        ],
      },
      attributes: new Map(),
      children: [],
      left: null,
      right: null,
      checksum: 0,
      isDirty: false,
      parent: null,
      eventHandlers: new Map(),
      state: null,
      hooks: [],
    };
  }
}

/**
 * Example of a custom event listener
 */
class LoggingLazyLoadListener extends LazyLoadEventListener {
  onLoadStart(componentId: string): void {
    console.log(`Loading started for component: ${componentId}`);
  }

  onLoadSuccess(componentId: string): void {
    console.log(`Loading succeeded for component: ${componentId}`);
  }

  onLoadError(componentId: string, error: Error): void {
    console.error(`Loading failed for component: ${componentId}`, error);
  }

  onVisibilityChange(componentId: string, isVisible: boolean): void {
    console.log(`Visibility changed for component: ${componentId}`, isVisible);
  }
}

// Example usage:
const lazyLoader = BinaryJSLazyLoader.getInstance();
lazyLoader.addListener(new LoggingLazyLoadListener());

const userProfile = new UserProfileComponent();
await userProfile.initialize();
const renderedNode = await userProfile.render();
