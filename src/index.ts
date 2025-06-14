// Core exports
export { BinaryJS } from "./core/BinaryJS";
export { BinaryDOM } from "./core/BinaryDOM";
export { BinaryJSState } from "./core/BinaryJSState";
export { BinaryJSHooks } from "./core/BinaryJSHooks";
export { BinaryJSApiClient } from "./core/BinaryJSApiClient";

// Component exports
export { BinaryJSComponent } from "./components/BinaryJSComponent";
export { ErrorBoundary } from "./components/ErrorBoundary";
export { Portal } from "./components/Portal";
export { Suspense } from "./components/Suspense";

// Utility exports
export * from "./utils/BinaryJSUtils";

// Type exports
export type {
  BinaryJSNode,
  BinaryJSProps,
  BinaryJSOptions,
  NodeType,
  StateType,
  HookType,
} from "./types/BinaryJSTypes";

import { BinaryDOMRenderer, BinaryDOMNode } from "binarydom";

export class BinaryJS {
  private renderer: BinaryDOMRenderer;

  constructor(container: HTMLElement) {
    this.renderer = new BinaryDOMRenderer(container);
  }

  render(node: BinaryDOMNode) {
    this.renderer.render(node);
  }

  // Example component to test the integration
  static createExampleComponent(): BinaryDOMNode {
    return {
      type: "element",
      tagName: "div",
      id: "example",
      props: {
        className: "example-component",
        children: [
          {
            type: "text",
            id: "example-text",
            value: "Hello from BinaryJS!",
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
