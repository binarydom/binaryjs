import { BinaryDOMNode } from "binarydom";

/**
 * Lifecycle states for components
 */
enum LifecycleState {
  CONSTRUCTING = "constructing",
  INITIALIZING = "initializing",
  READY = "ready",
  DESTROYING = "destroying",
  DESTROYED = "destroyed",
}

/**
 * Dependency injection container
 */
class DependencyContainer {
  private static instance: DependencyContainer;
  private dependencies: Map<string, any> = new Map();
  private factories: Map<string, () => any> = new Map();

  private constructor() {}

  static getInstance(): DependencyContainer {
    if (!DependencyContainer.instance) {
      DependencyContainer.instance = new DependencyContainer();
    }
    return DependencyContainer.instance;
  }

  register<T>(token: string, instance: T): void {
    this.dependencies.set(token, instance);
  }

  registerFactory<T>(token: string, factory: () => T): void {
    this.factories.set(token, factory);
  }

  resolve<T>(token: string): T {
    if (this.dependencies.has(token)) {
      return this.dependencies.get(token);
    }

    if (this.factories.has(token)) {
      const instance = this.factories.get(token)!();
      this.dependencies.set(token, instance);
      return instance;
    }

    throw new Error(`Dependency not found: ${token}`);
  }
}

/**
 * Lifecycle event listener
 */
abstract class LifecycleEventListener {
  abstract onStateChange(componentId: string, state: LifecycleState): void;
  abstract onError(componentId: string, error: Error): void;
  abstract onAsyncComplete(componentId: string, operation: string): void;
}

/**
 * Core lifecycle management system
 */
export class BinaryJSLifecycle {
  private static instance: BinaryJSLifecycle;
  private components: Map<string, any> = new Map();
  private states: Map<string, LifecycleState> = new Map();
  private listeners: Set<LifecycleEventListener> = new Set();
  private dependencyContainer: DependencyContainer;

  private constructor() {
    this.dependencyContainer = DependencyContainer.getInstance();
  }

  static getInstance(): BinaryJSLifecycle {
    if (!BinaryJSLifecycle.instance) {
      BinaryJSLifecycle.instance = new BinaryJSLifecycle();
    }
    return BinaryJSLifecycle.instance;
  }

  addListener(listener: LifecycleEventListener): void {
    this.listeners.add(listener);
  }

  removeListener(listener: LifecycleEventListener): void {
    this.listeners.delete(listener);
  }

  private notifyListeners(
    event: keyof LifecycleEventListener,
    ...args: any[]
  ): void {
    this.listeners.forEach((listener) => {
      const handler = listener[event];
      if (typeof handler === "function") {
        (handler as Function).apply(listener, args);
      }
    });
  }

  async initializeComponent(
    component: any,
    componentId: string
  ): Promise<void> {
    this.components.set(componentId, component);
    this.states.set(componentId, LifecycleState.CONSTRUCTING);

    try {
      // Handle constructor dependencies
      if (typeof component.constructor === "function") {
        await this.handleConstructor(component);
      }

      this.states.set(componentId, LifecycleState.INITIALIZING);

      // Handle async operations
      if (typeof component.asyncs === "function") {
        await this.handleAsyncs(component, componentId);
      }

      // Handle sync operations
      if (typeof component.syncs === "function") {
        await this.handleSyncs(component, componentId);
      }

      // Handle load operations
      if (typeof component.load === "function") {
        await this.handleLoad(component, componentId);
      }

      this.states.set(componentId, LifecycleState.READY);
      this.notifyListeners("onStateChange", componentId, LifecycleState.READY);
    } catch (error) {
      this.notifyListeners("onError", componentId, error as Error);
      throw error;
    }
  }

  private async handleConstructor(component: any): Promise<void> {
    // Since we can't use Reflect.getMetadata, we'll use a simpler approach
    const dependencies = [];
    if (component.constructor.name === "UserProfileComponent") {
      dependencies.push(
        this.dependencyContainer.resolve("userservice"),
        this.dependencyContainer.resolve("authservice")
      );
    }

    if (dependencies.length > 0) {
      await component.initializeDependencies(...dependencies);
    }
  }

  private async handleAsyncs(
    component: any,
    componentId: string
  ): Promise<void> {
    const asyncOperations = await component.asyncs();
    for (const [operation, promise] of Object.entries(asyncOperations)) {
      try {
        await promise;
        this.notifyListeners("onAsyncComplete", componentId, operation);
      } catch (error) {
        this.notifyListeners("onError", componentId, error as Error);
        throw error;
      }
    }
  }

  private async handleSyncs(
    component: any,
    componentId: string
  ): Promise<void> {
    try {
      await component.syncs();
    } catch (error) {
      this.notifyListeners("onError", componentId, error as Error);
      throw error;
    }
  }

  private async handleLoad(component: any, componentId: string): Promise<void> {
    try {
      await component.load();
    } catch (error) {
      this.notifyListeners("onError", componentId, error as Error);
      throw error;
    }
  }

  async destroyComponent(componentId: string): Promise<void> {
    const component = this.components.get(componentId);
    if (!component) return;

    this.states.set(componentId, LifecycleState.DESTROYING);
    this.notifyListeners(
      "onStateChange",
      componentId,
      LifecycleState.DESTROYING
    );

    try {
      if (typeof component.leave === "function") {
        await component.leave();
      }

      this.components.delete(componentId);
      this.states.set(componentId, LifecycleState.DESTROYED);
      this.notifyListeners(
        "onStateChange",
        componentId,
        LifecycleState.DESTROYED
      );
    } catch (error) {
      this.notifyListeners("onError", componentId, error as Error);
      throw error;
    }
  }

  getState(componentId: string): LifecycleState | undefined {
    return this.states.get(componentId);
  }

  getComponent(componentId: string): any {
    return this.components.get(componentId);
  }
}

/**
 * Base class for components with lifecycle management
 */
export abstract class LifecycleComponent {
  protected lifecycle: BinaryJSLifecycle;
  protected componentId: string;

  constructor(componentId: string) {
    this.lifecycle = BinaryJSLifecycle.getInstance();
    this.componentId = componentId;
  }

  abstract render(): Promise<BinaryDOMNode>;

  async initialize(): Promise<void> {
    await this.lifecycle.initializeComponent(this, this.componentId);
  }

  async destroy(): Promise<void> {
    await this.lifecycle.destroyComponent(this.componentId);
  }

  getState(): LifecycleState | undefined {
    return this.lifecycle.getState(this.componentId);
  }
}

/**
 * Example usage of the lifecycle system
 */
class UserProfileComponent extends LifecycleComponent {
  private userService: any;
  private authService: any;

  constructor() {
    super("user-profile");
  }

  async initializeDependencies(
    userService: any,
    authService: any
  ): Promise<void> {
    this.userService = userService;
    this.authService = authService;
  }

  async asyncs(): Promise<Record<string, Promise<any>>> {
    return {
      loadUserPreferences: this.userService.loadPreferences(),
      loadUserSettings: this.userService.loadSettings(),
    };
  }

  async syncs(): Promise<void> {
    // Initialize local state
    this.initializeLocalState();
  }

  async load(): Promise<void> {
    // Load initial data
    await this.loadInitialData();
  }

  async leave(): Promise<void> {
    // Cleanup resources
    await this.cleanup();
  }

  async render(): Promise<BinaryDOMNode> {
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
            value: "User Profile",
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

  private initializeLocalState(): void {
    // Initialize component state
  }

  private async loadInitialData(): Promise<void> {
    // Load initial data
  }

  private async cleanup(): Promise<void> {
    // Cleanup resources
  }
}

/**
 * Example of a custom event listener
 */
class LoggingLifecycleListener extends LifecycleEventListener {
  onStateChange(componentId: string, state: LifecycleState): void {
    console.log(`Component ${componentId} state changed to: ${state}`);
  }

  onError(componentId: string, error: Error): void {
    console.error(`Component ${componentId} error:`, error);
  }

  onAsyncComplete(componentId: string, operation: string): void {
    console.log(
      `Component ${componentId} completed async operation: ${operation}`
    );
  }
}

// Example usage:
const lifecycle = BinaryJSLifecycle.getInstance();
lifecycle.addListener(new LoggingLifecycleListener());

// Register dependencies
const container = DependencyContainer.getInstance();
container.register("userservice", {
  loadPreferences: () => Promise.resolve({ theme: "dark" }),
  loadSettings: () => Promise.resolve({ notifications: true }),
});
container.register("authservice", {
  isAuthenticated: () => true,
});

// Create and initialize component
const userProfile = new UserProfileComponent();
await userProfile.initialize();
const renderedNode = await userProfile.render();

// Later, destroy the component
await userProfile.destroy();
