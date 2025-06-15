import { BinaryDOMRenderer, BinaryDOMNode } from "binarydom";
import { BinaryJSState } from "./BinaryJSState";
import { BinaryJSHooks } from "./BinaryJSHooks";
import { BinaryJSApiClient } from "./BinaryJSApiClient";
import { BinaryJSComponent } from "../components/BinaryJSComponent";

export class BinaryJS {
  private renderer: BinaryDOMRenderer;
  private state: BinaryJSState;
  private hooks: BinaryJSHooks;
  private api: BinaryJSApiClient;
  private updateQueue: Set<string> = new Set();
  private isBatching: boolean = false;
  private performanceMetrics: Map<string, number> = new Map();

  constructor(
    container: HTMLElement,
    options: {
      enablePerformanceTracking?: boolean;
      batchUpdates?: boolean;
      maxBatchSize?: number;
      enableHotReload?: boolean;
    } = {}
  ) {
    this.renderer = new BinaryDOMRenderer(container);
    this.state = BinaryJSState.getInstance();
    this.hooks = new BinaryJSHooks();
    this.api = BinaryJSApiClient.getInstance();

    // Initialize performance tracking
    if (options.enablePerformanceTracking) {
      this.initializePerformanceTracking();
    }

    // Setup hot reload in development
    if (options.enableHotReload && process.env.NODE_ENV === "development") {
      this.setupHotReload();
    }
  }

  private initializePerformanceTracking() {
    const metrics = ["render", "update", "state", "api"];
    metrics.forEach((metric) => {
      this.performanceMetrics.set(metric, 0);
    });
  }

  private setupHotReload() {
    if (typeof window !== "undefined") {
      const ws = new WebSocket("ws://localhost:8080");
      ws.onmessage = (event) => {
        if (event.data === "reload") {
          window.location.reload();
        }
      };
    }
  }

  public render(node: BinaryDOMNode) {
    const startTime = performance.now();

    // Batch updates for better performance
    if (this.isBatching) {
      this.updateQueue.add(node.id);
      return;
    }

    this.isBatching = true;
    requestAnimationFrame(() => {
      this.renderer.render(node);
      this.isBatching = false;
      this.updateQueue.clear();

      // Track performance
      const endTime = performance.now();
      this.performanceMetrics.set("render", endTime - startTime);
    });
  }

  public getState<T>(key: string): T | undefined {
    return this.state.getState<T>(key);
  }

  public setState<T>(key: string, value: T): void {
    const startTime = performance.now();
    this.state.setState(key, value);
    this.performanceMetrics.set("state", performance.now() - startTime);
  }

  public subscribe<T>(key: string, callback: (value: T) => void): void {
    this.state.subscribe(key, callback);
  }

  public useHook<T>(
    hookType: string,
    initialValue: T
  ): [T, (value: T) => void] {
    return this.hooks.useHook(hookType, initialValue);
  }

  public async fetch<T>(url: string, options?: RequestInit): Promise<T> {
    const startTime = performance.now();
    const result = await this.api.fetch<T>(url, options);
    this.performanceMetrics.set("api", performance.now() - startTime);
    return result;
  }

  public getPerformanceMetrics(): Map<string, number> {
    return new Map(this.performanceMetrics);
  }

  public static createComponent<P = {}, S = {}>(
    Component: new (props: P) => BinaryJSComponent<P, S>,
    props: P
  ): BinaryDOMNode {
    const instance = new Component(props);
    return instance.render();
  }

  public static createElement(
    type: string | (new (props: any) => BinaryJSComponent),
    props: any = {},
    ...children: any[]
  ): BinaryDOMNode {
    if (typeof type === "function") {
      return this.createComponent(type, { ...props, children });
    }

    return {
      type: "element",
      tagName: type,
      id: Math.random().toString(36).substring(2, 11),
      props: {
        ...props,
        children: children.flat().filter(Boolean),
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

  public static createTextNode(text: string): BinaryDOMNode {
    return {
      type: "text",
      id: Math.random().toString(36).substring(2, 11),
      value: text,
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
    };
  }
}
