import { BinaryDOMNode } from "binarydom";
import { BinaryJSLifecycle } from "../core/BinaryJSLifecycle";
import { BinaryJSState } from "../core/BinaryJSState";
import { StyledComponent } from "../core/BinaryJSStyle";

/**
 * Base class for all predefined components
 */
abstract class BinaryJSComponent extends StyledComponent {
  protected lifecycle: BinaryJSLifecycle;
  protected state: BinaryJSState;

  constructor() {
    super();
    this.lifecycle = BinaryJSLifecycle.getInstance();
    this.state = BinaryJSState.getInstance();
  }

  abstract render(): Promise<BinaryDOMNode>;
}

/**
 * Link component with advanced features
 */
export class Href extends BinaryJSComponent {
  private url: string;
  private target?: string;
  private rel?: string;

  constructor(url: string, target?: string, rel?: string) {
    super();
    this.url = url;
    this.target = target;
    this.rel = rel;
    this.initializeStyles();
  }

  private initializeStyles(): void {
    this.addStyle(
      {
        color: "var(--link-color, #007bff)",
        textDecoration: "none",
        transition: "color 0.2s ease",
      },
      {
        scope: "isolated",
        pseudoClasses: {
          hover: "color: var(--link-hover-color, #0056b3);",
        },
      }
    );
  }

  async render(): Promise<BinaryDOMNode> {
    return {
      type: "element",
      tagName: "a",
      id: `href-${this.url}`,
      props: {
        href: this.url,
        target: this.target,
        rel: this.rel,
        className: "binary-href",
        children: [],
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
 * Route component with advanced routing features
 */
export class Route extends BinaryJSComponent {
  private path: string;
  private component: BinaryJSComponent;
  private params: Map<string, string> = new Map();

  constructor(path: string, component: BinaryJSComponent) {
    super();
    this.path = path;
    this.component = component;
    this.initializeStyles();
  }

  private initializeStyles(): void {
    this.addStyle({
      display: "block",
      width: "100%",
      height: "100%",
    });
  }

  setParams(params: Map<string, string>): void {
    this.params = params;
  }

  async render(): Promise<BinaryDOMNode> {
    return await this.component.render();
  }
}

/**
 * State wrapper component
 */
export class State<T> extends BinaryJSComponent {
  private value: T;
  private key: string;

  constructor(key: string, initialValue: T) {
    super();
    this.key = key;
    this.value = initialValue;
    this.initializeStyles();
  }

  private initializeStyles(): void {
    this.addStyle({
      display: "contents",
    });
  }

  async setValue(value: T): Promise<void> {
    this.value = value;
    await this.state.setState(this.key, value);
  }

  async getValue(): Promise<T> {
    return (await this.state.getState<T>(this.key)) || this.value;
  }

  async render(): Promise<BinaryDOMNode> {
    const value = await this.getValue();
    return {
      type: "element",
      tagName: "div",
      id: `state-${this.key}`,
      props: {
        className: "binary-state",
        children: [
          {
            type: "text",
            id: `state-value-${this.key}`,
            value: String(value),
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
 * Async wrapper component
 */
export class Async<T> extends BinaryJSComponent {
  private promise: Promise<T>;
  private loadingComponent?: BinaryJSComponent;
  private errorComponent?: BinaryJSComponent;

  constructor(
    promise: Promise<T>,
    loadingComponent?: BinaryJSComponent,
    errorComponent?: BinaryJSComponent
  ) {
    super();
    this.promise = promise;
    this.loadingComponent = loadingComponent;
    this.errorComponent = errorComponent;
    this.initializeStyles();
  }

  private initializeStyles(): void {
    this.addStyle({
      display: "contents",
    });
  }

  async render(): Promise<BinaryDOMNode> {
    try {
      const result = await this.promise;
      return {
        type: "element",
        tagName: "div",
        id: "async-result",
        props: {
          className: "binary-async",
          children: [
            {
              type: "text",
              id: "async-value",
              value: String(result),
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
    } catch (error) {
      if (this.errorComponent) {
        return await this.errorComponent.render();
      }
      throw error;
    }
  }
}

/**
 * Sync wrapper component
 */
export class Sync<T> extends BinaryJSComponent {
  private value: T;
  private renderFn: (value: T) => Promise<BinaryDOMNode>;

  constructor(value: T, renderFn: (value: T) => Promise<BinaryDOMNode>) {
    super();
    this.value = value;
    this.renderFn = renderFn;
    this.initializeStyles();
  }

  private initializeStyles(): void {
    this.addStyle({
      display: "contents",
    });
  }

  async render(): Promise<BinaryDOMNode> {
    return await this.renderFn(this.value);
  }
}

/**
 * Loop wrapper component
 */
export class Loop<T> extends BinaryJSComponent {
  private items: T[];
  private renderFn: (item: T, index: number) => Promise<BinaryDOMNode>;

  constructor(
    items: T[],
    renderFn: (item: T, index: number) => Promise<BinaryDOMNode>
  ) {
    super();
    this.items = items;
    this.renderFn = renderFn;
    this.initializeStyles();
  }

  private initializeStyles(): void {
    this.addStyle({
      display: "contents",
    });
  }

  async render(): Promise<BinaryDOMNode> {
    const children = await Promise.all(
      this.items.map((item, index) => this.renderFn(item, index))
    );

    return {
      type: "element",
      tagName: "div",
      id: "loop-container",
      props: {
        className: "binary-loop",
        children,
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
 * If wrapper component
 */
export class If extends BinaryJSComponent {
  private condition: boolean;
  private component: BinaryJSComponent;

  constructor(condition: boolean, component: BinaryJSComponent) {
    super();
    this.condition = condition;
    this.component = component;
    this.initializeStyles();
  }

  private initializeStyles(): void {
    this.addStyle({
      display: "contents",
    });
  }

  async render(): Promise<BinaryDOMNode> {
    if (this.condition) {
      return await this.component.render();
    }
    return {
      type: "element",
      tagName: "div",
      id: "if-empty",
      props: {
        className: "binary-if-empty",
        children: [],
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
 * IfElse wrapper component
 */
export class IfElse extends BinaryJSComponent {
  private condition: boolean;
  private ifComponent: BinaryJSComponent;
  private elseComponent: BinaryJSComponent;

  constructor(
    condition: boolean,
    ifComponent: BinaryJSComponent,
    elseComponent: BinaryJSComponent
  ) {
    super();
    this.condition = condition;
    this.ifComponent = ifComponent;
    this.elseComponent = elseComponent;
    this.initializeStyles();
  }

  private initializeStyles(): void {
    this.addStyle({
      display: "contents",
    });
  }

  async render(): Promise<BinaryDOMNode> {
    return await (
      this.condition ? this.ifComponent : this.elseComponent
    ).render();
  }
}

/**
 * Switch wrapper component
 */
export class Switch<T> extends BinaryJSComponent {
  private value: T;
  private cases: Map<T, BinaryJSComponent>;
  private defaultComponent?: BinaryJSComponent;

  constructor(
    value: T,
    cases: Map<T, BinaryJSComponent>,
    defaultComponent?: BinaryJSComponent
  ) {
    super();
    this.value = value;
    this.cases = cases;
    this.defaultComponent = defaultComponent;
    this.initializeStyles();
  }

  private initializeStyles(): void {
    this.addStyle({
      display: "contents",
    });
  }

  async render(): Promise<BinaryDOMNode> {
    const component = this.cases.get(this.value) || this.defaultComponent;
    if (component) {
      return await component.render();
    }
    return {
      type: "element",
      tagName: "div",
      id: "switch-empty",
      props: {
        className: "binary-switch-empty",
        children: [],
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
 * Loading wrapper component
 */
export class Loading extends BinaryJSComponent {
  private isLoading: boolean;
  private loadingComponent: BinaryJSComponent;
  private contentComponent: BinaryJSComponent;

  constructor(
    isLoading: boolean,
    loadingComponent: BinaryJSComponent,
    contentComponent: BinaryJSComponent
  ) {
    super();
    this.isLoading = isLoading;
    this.loadingComponent = loadingComponent;
    this.contentComponent = contentComponent;
    this.initializeStyles();
  }

  private initializeStyles(): void {
    this.addStyle({
      display: "contents",
    });
  }

  async render(): Promise<BinaryDOMNode> {
    return await (
      this.isLoading ? this.loadingComponent : this.contentComponent
    ).render();
  }
}

// Example usage:
const userList = new Loop(
  ["User 1", "User 2", "User 3"],
  async (user, index) => ({
    type: "element",
    tagName: "div",
    id: `user-${index}`,
    props: {
      className: "user-item",
      children: [
        {
          type: "text",
          id: `user-name-${index}`,
          value: user,
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
  })
);

const loadingSpinner = new Loading(
  true,
  new Sync("Loading...", async (text) => ({
    type: "element",
    tagName: "div",
    id: "loading",
    props: {
      className: "loading-spinner",
      children: [
        {
          type: "text",
          id: "loading-text",
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
  })),
  userList
);
