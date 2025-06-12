import { BinaryDOMNode } from "binarydom";
import { BinaryJSComponent } from "../components/BinaryJSComponents";
import { BinaryJSApiClient } from "../core/BinaryJSApiClient";
import { BinaryJSState } from "../core/BinaryJSState";
import { BinaryJSRouter } from "../core/BinaryJSRouter";
import { BinaryJSHooks } from "../core/BinaryJSHooks";
import { BinaryJSDOM } from "../core/BinaryJSDOM";

/**
 * Examples demonstrating the usage of BinaryJS core features
 */
class BinaryJSCoreExamples {
  /**
   * Component Examples
   */
  static componentExamples() {
    // Basic Component
    class UserCard extends BinaryJSComponent {
      private name: string;
      private age: number;

      constructor(name: string, age: number) {
        super();
        this.name = name;
        this.age = age;
      }

      async render(): Promise<BinaryDOMNode> {
        return {
          type: "element",
          tagName: "div",
          id: `user-${this.name}`,
          props: {
            className: "user-card",
            children: [
              {
                type: "text",
                id: `name-${this.name}`,
                value: this.name,
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

    // Component with State
    class Counter extends BinaryJSComponent {
      private count: number = 0;

      async increment() {
        this.count++;
        await this.render();
      }

      async render(): Promise<BinaryDOMNode> {
        return {
          type: "element",
          tagName: "div",
          id: "counter",
          props: {
            className: "counter",
            children: [
              {
                type: "text",
                id: "count",
                value: String(this.count),
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
  }

  /**
   * Hooks Examples
   */
  static hooksExamples() {
    const hooks = new BinaryJSHooks();

    // useState Hook
    const [count, setCount] = hooks.useState(0);

    // useEffect Hook
    hooks.useEffect(() => {
      console.log("Count changed:", count);
    }, [count]);

    // useMemo Hook
    const doubledCount = hooks.useMemo(() => count * 2, [count]);

    // useCallback Hook
    const increment = hooks.useCallback(() => {
      setCount(count + 1);
    }, [count]);
  }

  /**
   * Router Examples
   */
  static routerExamples() {
    const router = new BinaryJSRouter();

    // Define routes
    router.addRoute("/users", async () => {
      return {
        type: "element",
        tagName: "div",
        id: "users-page",
        props: {
          className: "users-page",
          children: [
            {
              type: "text",
              id: "users-title",
              value: "Users Page",
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
    });

    // Navigation
    router.navigate("/users");
  }

  /**
   * Data Fetching Examples
   */
  static dataFetchingExamples() {
    const apiClient = BinaryJSApiClient.getInstance();

    // Mutation example
    const updateUser = apiClient.mutate(
      "updateUser",
      { name: "John", age: 30 },
      { optimisticUpdate: true }
    );
  }

  /**
   * State Management Examples
   */
  static stateExamples() {
    const state = BinaryJSState.getInstance();

    // Set state
    state.setState("user", { name: "John", age: 30 });

    // Get state
    const user = state.getState("user");

    // Subscribe to state changes
    state.subscribe("user", (newValue: any) => {
      console.log("User state changed:", newValue);
    });

    // Example of state persistence
    state.setState("settings", {
      theme: "dark",
      language: "en",
      notifications: true,
    });

    // Retrieve persisted state
    const settings = state.getState("settings");
    console.log("User settings:", settings);
  }

  /**
   * DOM Improvement Examples
   */
  static domExamples() {
    const dom = new BinaryJSDOM();

    // Create element with improved performance
    const element = dom.createElement("div", {
      className: "container",
      children: [dom.createTextNode("Hello World")],
    });

    // Batch updates
    dom.batchUpdate(() => {
      dom.appendChild(element, dom.createElement("span"));
      dom.setAttribute(element, "data-id", "123");
    });

    // Virtual DOM diffing
    const oldTree = dom.createElement("div");
    const newTree = dom.createElement("div", { className: "updated" });
    const patches = dom.diff(oldTree, newTree);
    dom.applyPatches(patches);
  }

  /**
   * Server-Side Rendering Examples
   */
  static ssrExamples() {
    class ServerComponent extends BinaryJSComponent {
      async render(): Promise<BinaryDOMNode> {
        // Fetch data on server
        const data = await fetch("https://api.example.com/data").then((r) =>
          r.json()
        );

        return {
          type: "element",
          tagName: "div",
          id: "server-component",
          props: {
            className: "server-component",
            children: [
              {
                type: "text",
                id: "server-data",
                value: JSON.stringify(data),
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
  }

  /**
   * Run all examples
   */
  static runAllExamples() {
    console.log("=== Component Examples ===");
    this.componentExamples();

    console.log("\n=== Hooks Examples ===");
    this.hooksExamples();

    console.log("\n=== Router Examples ===");
    this.routerExamples();

    console.log("\n=== Data Fetching Examples ===");
    this.dataFetchingExamples();

    console.log("\n=== State Management Examples ===");
    this.stateExamples();

    console.log("\n=== DOM Improvement Examples ===");
    this.domExamples();

    console.log("\n=== Server-Side Rendering Examples ===");
    this.ssrExamples();
  }
}

// Run all examples
BinaryJSCoreExamples.runAllExamples();
