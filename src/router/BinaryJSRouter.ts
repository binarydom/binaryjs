import { BinaryDOMNode } from 'binarydom';
import { BinaryDOMRenderer } from 'binarydom';

/**
 * Represents a route configuration with advanced features
 */
export interface RouteConfig {
  path: string;
  component: typeof RouteComponent;
  children?: RouteConfig[];
  middleware?: RouteMiddleware[];
  data?: () => Promise<any>;
  cache?: {
    enabled: boolean;
    ttl?: number;
  };
}

/**
 * Represents a route middleware function
 */
export type RouteMiddleware = (context: RouteContext) => Promise<boolean>;

/**
 * Represents the current route context
 */
export class RouteContext {
  private static instance: RouteContext;
  private params: Map<string, string> = new Map();
  private query: Map<string, string> = new Map();
  private data: Map<string, any> = new Map();
  private cache: Map<string, { data: any; timestamp: number }> = new Map();

  private constructor() {}

  static getInstance(): RouteContext {
    if (!RouteContext.instance) {
      RouteContext.instance = new RouteContext();
    }
    return RouteContext.instance;
  }

  setParam(key: string, value: string) {
    this.params.set(key, value);
  }

  getParam(key: string): string | undefined {
    return this.params.get(key);
  }

  setQuery(key: string, value: string) {
    this.query.set(key, value);
  }

  getQuery(key: string): string | undefined {
    return this.query.get(key);
  }

  setData(key: string, value: any) {
    this.data.set(key, value);
  }

  getData(key: string): any {
    return this.data.get(key);
  }

  async fetchData<T>(key: string, fetcher: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = this.cache.get(key);
    if (cached && (!ttl || Date.now() - cached.timestamp < ttl)) {
      return cached.data;
    }

    const data = await fetcher();
    this.cache.set(key, { data, timestamp: Date.now() });
    return data;
  }

  clearCache() {
    this.cache.clear();
  }
}

/**
 * Base class for route components with advanced features
 */
export abstract class RouteComponent {
  protected context: RouteContext;
  protected state: Map<string, any> = new Map();
  protected node: BinaryDOMNode | null = null;

  constructor() {
    this.context = RouteContext.getInstance();
  }

  abstract render(): BinaryDOMNode;

  protected setState(key: string, value: any) {
    this.state.set(key, value);
    this.update();
  }

  protected getState(key: string): any {
    return this.state.get(key);
  }

  protected update() {
    if (this.node) {
      const newNode = this.render();
      this.node = newNode;
    }
  }

  async beforeEnter(): Promise<boolean> {
    return true;
  }

  async afterEnter(): Promise<void> {}

  async beforeLeave(): Promise<boolean> {
    return true;
  }

  async afterLeave(): Promise<void> {}
}

/**
 * Advanced router implementation with server and client support
 */
export class BinaryJSRouter {
  private static instance: BinaryJSRouter;
  private routes: Map<string, RouteConfig> = new Map();
  private renderer: BinaryDOMRenderer;
  private currentRoute: RouteConfig | null = null;
  private history: History;
  private isServer: boolean;

  private constructor(isServer: boolean = false) {
    this.renderer = new BinaryDOMRenderer(document.createElement('div'));
    this.history = window.history;
    this.isServer = isServer;
  }

  static getInstance(isServer: boolean = false): BinaryJSRouter {
    if (!BinaryJSRouter.instance) {
      BinaryJSRouter.instance = new BinaryJSRouter(isServer);
    }
    return BinaryJSRouter.instance;
  }

  /**
   * Registers a route with the router
   */
  registerRoute(config: RouteConfig) {
    this.routes.set(config.path, config);
  }

  /**
   * Registers multiple routes at once
   */
  registerRoutes(configs: RouteConfig[]) {
    configs.forEach(config => this.registerRoute(config));
  }

  /**
   * Navigates to a new route
   */
  async navigate(path: string, options: { replace?: boolean; state?: any } = {}) {
    const route = this.findRoute(path);
    if (!route) {
      throw new Error(`Route not found: ${path}`);
    }

    if (this.currentRoute) {
      const canLeave = await this.executeBeforeLeave();
      if (!canLeave) return;
    }

    const context = RouteContext.getInstance();
    const params = this.extractParams(route.path, path);
    params.forEach((value, key) => context.setParam(key, value));

    const query = this.extractQuery(path);
    query.forEach((value, key) => context.setQuery(key, value));

    if (route.data) {
      const data = await route.data();
      context.setData(route.path, data);
    }

    const canEnter = await this.executeBeforeEnter(route);
    if (!canEnter) return;

    this.currentRoute = route;

    if (this.isServer) {
      return this.renderServer(route);
    } else {
      this.updateHistory(path, options);
      return this.renderClient(route);
    }
  }

  /**
   * Renders the current route on the server
   */
  private async renderServer(route: RouteConfig): Promise<string> {
    const Component = route.component;
    const component = new Component();
    const node = component.render();
    return this.renderer.renderToString(node);
  }

  /**
   * Renders the current route on the client
   */
  private async renderClient(route: RouteConfig): Promise<void> {
    const Component = route.component;
    const component = new Component();
    const node = component.render();
    this.renderer.hydrate(node, document.getElementById('app')!);
  }

  /**
   * Finds a route configuration for a given path
   */
  private findRoute(path: string): RouteConfig | undefined {
    return this.routes.get(path);
  }

  /**
   * Extracts route parameters from a path
   */
  private extractParams(routePath: string, currentPath: string): Map<string, string> {
    const params = new Map<string, string>();
    const routeParts = routePath.split('/');
    const pathParts = currentPath.split('/');

    routeParts.forEach((part, index) => {
      if (part.startsWith(':')) {
        const paramName = part.slice(1);
        params.set(paramName, pathParts[index]);
      }
    });

    return params;
  }

  /**
   * Extracts query parameters from a path
   */
  private extractQuery(path: string): Map<string, string> {
    const query = new Map<string, string>();
    const queryString = path.split('?')[1];
    
    if (queryString) {
      queryString.split('&').forEach(pair => {
        const [key, value] = pair.split('=');
        query.set(key, decodeURIComponent(value));
      });
    }

    return query;
  }

  /**
   * Updates the browser history
   */
  private updateHistory(path: string, options: { replace?: boolean; state?: any }) {
    if (options.replace) {
      this.history.replaceState(options.state, '', path);
    } else {
      this.history.pushState(options.state, '', path);
    }
  }

  /**
   * Executes beforeEnter hooks
   */
  private async executeBeforeEnter(route: RouteConfig): Promise<boolean> {
    if (route.middleware) {
      for (const middleware of route.middleware) {
        const result = await middleware(RouteContext.getInstance());
        if (!result) return false;
      }
    }

    const Component = route.component;
    const component = new Component();
    return component.beforeEnter();
  }

  /**
   * Executes beforeLeave hooks
   */
  private async executeBeforeLeave(): Promise<boolean> {
    if (!this.currentRoute) return true;

    const Component = this.currentRoute.component;
    const component = new Component();
    return component.beforeLeave();
  }
}

/**
 * Example usage of the router system
 */
export class HomeComponent extends RouteComponent {
  async beforeEnter(): Promise<boolean> {
    const data = await this.context.fetchData('home-data', async () => {
      const response = await fetch('/api/home');
      return response.json();
    }, 5000); // Cache for 5 seconds

    this.setState('data', data);
    return true;
  }

  render(): BinaryDOMNode {
    const data = this.getState('data');

    return {
      type: 'element',
      tagName: 'div',
      id: 'home',
      props: {
        className: 'home-page',
        children: [{
          type: 'text',
          id: 'welcome',
          value: data?.welcome || 'Welcome',
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
          hooks: []
        }]
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
      hooks: []
    };
  }
} 