import { BinaryDOMNode } from 'binarydom';
import { BinaryDOMRenderer } from 'binarydom';

/**
 * Represents a client-side hydration context
 */
export class ClientContext {
  private static instance: ClientContext;
  private hydrationData: Map<string, any> = new Map();
  private componentRegistry: Map<string, typeof ClientComponent> = new Map();

  private constructor() {
    // Initialize hydration data from window
    const data = (window as any).__HYDRATION_DATA__;
    if (data) {
      Object.entries(data).forEach(([key, value]) => {
        this.hydrationData.set(key, value);
      });
    }
  }

  static getInstance(): ClientContext {
    if (!ClientContext.instance) {
      ClientContext.instance = new ClientContext();
    }
    return ClientContext.instance;
  }

  registerComponent(name: string, component: typeof ClientComponent) {
    this.componentRegistry.set(name, component);
  }

  getComponent(name: string): typeof ClientComponent | undefined {
    return this.componentRegistry.get(name);
  }

  getHydrationData(key: string): any {
    return this.hydrationData.get(key);
  }
}

/**
 * Base class for client-side components with hydration support
 */
export abstract class ClientComponent {
  protected context: ClientContext;
  protected state: Map<string, any>;
  protected node: BinaryDOMNode | null = null;

  constructor() {
    this.context = ClientContext.getInstance();
    this.state = new Map();
    this.initializeState();
  }

  protected initializeState() {
    const hydrationData = this.context.getHydrationData(this.constructor.name);
    if (hydrationData?.state) {
      Object.entries(hydrationData.state).forEach(([key, value]) => {
        this.state.set(key, value);
      });
    }
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
      // Update the node in place
      this.node = newNode;
    }
  }
}

/**
 * Client-side renderer with hydration support
 */
export class BinaryJSClient {
  private renderer: BinaryDOMRenderer;
  private context: ClientContext;
  private rootComponent: ClientComponent | null = null;

  constructor() {
    this.renderer = new BinaryDOMRenderer(document.createElement('div'));
    this.context = ClientContext.getInstance();
  }

  /**
   * Hydrates a component into the DOM
   */
  hydrate(component: ClientComponent, container: HTMLElement) {
    this.rootComponent = component;
    const node = component.render();
    this.renderer.hydrate(node, container);
  }

  /**
   * Registers a component for hydration
   */
  registerComponent(name: string, component: typeof ClientComponent) {
    this.context.registerComponent(name, component);
  }

  /**
   * Hydrates all components in the DOM
   */
  hydrateAll() {
    const components = document.querySelectorAll('[data-component]');
    components.forEach(element => {
      const componentName = element.getAttribute('data-component');
      if (componentName) {
        const ComponentClass = this.context.getComponent(componentName);
        if (ComponentClass) {
          const component = new ComponentClass();
          this.hydrate(component, element as HTMLElement);
        }
      }
    });
  }
}

/**
 * Example usage of the client-side hydration system
 */
export class UserProfileClientComponent extends ClientComponent {
  render(): BinaryDOMNode {
    const userData = this.getState('userData');

    return {
      type: 'element',
      tagName: 'div',
      id: 'user-profile',
      props: {
        className: 'user-profile',
        children: [{
          type: 'text',
          id: 'user-name',
          value: userData?.name || 'Loading...',
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