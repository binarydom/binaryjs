import { BinaryDOMNode } from "binarydom";
import { BinaryDOMRenderer } from "binarydom";

/**
 * Represents a server-side rendering context with advanced features
 */
export class ServerContext {
  private static instance: ServerContext;
  private cache: Map<string, any> = new Map();
  private pendingRequests: Map<string, Promise<any>> = new Map();
  private renderQueue: Array<() => Promise<void>> = [];
  private hydrationData: Map<string, any> = new Map();

  private constructor() {}

  static getInstance(): ServerContext {
    if (!ServerContext.instance) {
      ServerContext.instance = new ServerContext();
    }
    return ServerContext.instance;
  }

  async fetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }

    const request = fetcher().then((result) => {
      this.cache.set(key, result);
      this.pendingRequests.delete(key);
      return result;
    });

    this.pendingRequests.set(key, request);
    return request;
  }

  queueRender(renderFn: () => Promise<void>) {
    this.renderQueue.push(renderFn);
  }

  async flushRenderQueue() {
    await Promise.all(this.renderQueue.map((fn) => fn()));
    this.renderQueue = [];
  }

  setHydrationData(key: string, data: any) {
    this.hydrationData.set(key, data);
  }

  getHydrationData(key: string) {
    return this.hydrationData.get(key);
  }
}

/**
 * Represents a server-side component with advanced features
 */
export abstract class ServerComponent {
  protected context: ServerContext;
  protected state: Map<string, any> = new Map();
  protected dependencies: Set<string> = new Set();

  constructor() {
    this.context = ServerContext.getInstance();
  }

  abstract render(): Promise<BinaryDOMNode>;

  protected async fetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    this.dependencies.add(key);
    return this.context.fetch(key, fetcher);
  }

  protected setState(key: string, value: any) {
    this.state.set(key, value);
  }

  protected getState(key: string) {
    return this.state.get(key);
  }

  protected addDependency(key: string) {
    this.dependencies.add(key);
  }

  public getDependencies(): string[] {
    return Array.from(this.dependencies);
  }
}

/**
 * Advanced server-side renderer with streaming and partial hydration support
 */
export class BinaryJSServer {
  private renderer: BinaryDOMRenderer;
  private context: ServerContext;
  private componentCache: Map<string, ServerComponent> = new Map();
  private streamBuffer: string[] = [];
  private isStreaming: boolean = false;

  constructor() {
    this.renderer = new BinaryDOMRenderer(document.createElement("div"));
    this.context = ServerContext.getInstance();
  }

  /**
   * Renders a component with streaming support
   */
  async renderStream(component: ServerComponent): Promise<ReadableStream> {
    this.isStreaming = true;
    this.streamBuffer = [];

    const stream = new ReadableStream({
      start: async (controller) => {
        try {
          const node = await component.render();
          const html = this.renderer.renderToString(node);

          // Stream the HTML in chunks
          const chunkSize = 1024;
          for (let i = 0; i < html.length; i += chunkSize) {
            const chunk = html.slice(i, i + chunkSize);
            controller.enqueue(chunk);
            await new Promise((resolve) => setTimeout(resolve, 0));
          }

          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return stream;
  }

  /**
   * Renders a component with partial hydration
   */
  async renderWithHydration(component: ServerComponent): Promise<string> {
    const node = await component.render();
    const html = this.renderer.renderToString(node);

    // Add hydration data
    const hydrationData = {
      state: Object.fromEntries(component["state"]),
      dependencies: component.getDependencies(),
    };

    const script = `
      <script>
        window.__HYDRATION_DATA__ = ${JSON.stringify(hydrationData)};
      </script>
    `;

    return html + script;
  }

  /**
   * Renders multiple components in parallel with dependency tracking
   */
  async renderParallel(components: ServerComponent[]): Promise<string> {
    const renderPromises = components.map(async (component) => {
      const node = await component.render();
      return this.renderer.renderToString(node);
    });

    const results = await Promise.all(renderPromises);
    return results.join("");
  }

  /**
   * Renders a component with automatic data prefetching
   */
  async renderWithPrefetch(component: ServerComponent): Promise<string> {
    // Prefetch all dependencies
    const dependencies = component.getDependencies();
    await Promise.all(
      dependencies.map((key) =>
        this.context.fetch(key, () => Promise.resolve())
      )
    );

    return this.renderWithHydration(component);
  }

  /**
   * Renders a component with automatic error boundaries
   */
  async renderWithErrorBoundary(component: ServerComponent): Promise<string> {
    try {
      return await this.renderWithHydration(component);
    } catch (error: unknown) {
      // Render fallback UI
      return `
        <div class="error-boundary">
          <h1>Something went wrong</h1>
          <p>${error instanceof Error ? error.message : String(error)}</p>
        </div>
      `;
    }
  }
}

/**
 * Example usage of the server-side rendering system
 */
export class UserProfileComponent extends ServerComponent {
  async render(): Promise<BinaryDOMNode> {
    // Fetch user data with automatic caching
    const userData = await this.fetch("user-profile", async () => {
      const response = await fetch("https://api.example.com/user");
      return response.json();
    });

    // Set state for hydration
    this.setState("userData", userData);

    return {
      type: "element",
      tagName: "div",
      id: "user-profile",
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
