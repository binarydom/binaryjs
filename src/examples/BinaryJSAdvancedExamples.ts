import { BinaryDOMNode } from "binarydom";
import { BinaryJSComponent } from "../components/BinaryJSComponents";
import { BinaryJSApiClient } from "../core/BinaryJSApiClient";
import { BinaryJSState } from "../core/BinaryJSState";
import { BinaryJSRouter } from "../core/BinaryJSRouter";
import { BinaryJSHooks } from "../core/BinaryJSHooks";
import { BinaryJSDOM } from "../core/BinaryJSDOM";

// Type definitions
interface User {
  firstName: string;
  lastName: string;
  email: string;
}

interface UserProfile {
  name: string;
  email: string;
}

interface RouteParams {
  id: string;
}

/**
 * Advanced examples demonstrating complex BinaryJS features
 */
class BinaryJSAdvancedExamples {
  /**
   * Complex Component with State, Hooks, and Events
   */
  static complexComponentExample() {
    class UserDashboard extends BinaryJSComponent {
      protected hooks: BinaryJSHooks;
      protected state: BinaryJSState;
      protected api: BinaryJSApiClient;

      constructor() {
        super();
        this.hooks = new BinaryJSHooks();
        this.state = BinaryJSState.getInstance();
        this.api = BinaryJSApiClient.getInstance();
      }

      async initialize() {
        // Create state hooks
        const [user, setUser] = this.hooks.createState<User | null>(null);
        const [loading, setLoading] = this.hooks.createState<boolean>(true);
        const [error, setError] = this.hooks.createState<Error | null>(null);

        // Create memoized values
        const userFullName = this.hooks.createMemo(() => {
          return user ? `${user.firstName} ${user.lastName}` : "";
        }, [user]);

        // Create effects
        this.hooks.createEffect(async () => {
          try {
            setLoading(true);
            const data = await this.api.query<User>("user/profile");
            setUser(data);
          } catch (err) {
            setError(err as Error);
          } finally {
            setLoading(false);
          }
        }, []);

        // Create callbacks
        const updateProfile = this.hooks.createCallback(
          async (data: Partial<User>) => {
            try {
              await this.api.mutate("user/profile", data, {
                optimisticUpdate: true,
              });
              this.state.setState("user", data);
            } catch (err) {
              setError(err as Error);
            }
          },
          [user]
        );

        return { user, loading, error, userFullName, updateProfile };
      }

      async render(): Promise<BinaryDOMNode> {
        const { user, loading, error, userFullName, updateProfile } =
          await this.initialize();

        if (loading) {
          return this.renderLoading();
        }

        if (error) {
          return this.renderError(error);
        }

        return {
          type: "element",
          tagName: "div",
          id: "user-dashboard",
          props: {
            className: "dashboard",
            children: [
              {
                type: "element",
                tagName: "h1",
                id: "user-name",
                props: {
                  className: "user-name",
                  children: [
                    {
                      type: "text",
                      id: "name-text",
                      value: userFullName,
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

      private renderLoading(): BinaryDOMNode {
        return {
          type: "element",
          tagName: "div",
          id: "loading",
          props: {
            className: "loading",
            children: [
              {
                type: "text",
                id: "loading-text",
                value: "Loading...",
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

      private renderError(error: Error): BinaryDOMNode {
        return {
          type: "element",
          tagName: "div",
          id: "error",
          props: {
            className: "error",
            children: [
              {
                type: "text",
                id: "error-text",
                value: `Error: ${error.message}`,
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
   * Advanced Routing with Nested Routes and Guards
   */
  static advancedRoutingExample() {
    const router = new BinaryJSRouter();

    // Auth guard
    const authGuard = async () => {
      const state = BinaryJSState.getInstance();
      const user = state.getState("user");
      if (!user) {
        router.navigate("/login");
        return false;
      }
      return true;
    };

    // Nested routes
    router.addRoute("/dashboard", async () => {
      if (!(await authGuard())) return null;

      return {
        type: "element",
        tagName: "div",
        id: "dashboard",
        props: {
          className: "dashboard",
          children: [
            {
              type: "text",
              id: "dashboard-title",
              value: "Dashboard",
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

    // Dynamic route with params
    router.addRoute("/user/:id", async (params: RouteParams) => {
      if (!(await authGuard())) return null;

      const api = BinaryJSApiClient.getInstance();
      const user = await api.query<UserProfile>(`users/${params.id}`);

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
              value: user.name,
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
  }

  /**
   * Advanced State Management with Persistence and Events
   */
  static advancedStateExample() {
    const state = BinaryJSState.getInstance();

    // Complex state structure
    state.setState("app", {
      theme: "dark",
      language: "en",
      notifications: {
        enabled: true,
        sound: true,
        frequency: "daily",
      },
      user: {
        preferences: {
          fontSize: 16,
          colorScheme: "blue",
        },
      },
    });

    // State subscription with selector
    state.subscribe("app", (newValue: any) => {
      if (newValue.theme === "dark") {
        document.body.classList.add("dark-theme");
      } else {
        document.body.classList.remove("dark-theme");
      }
    });

    // Nested state updates
    state.setState("app.user.preferences", {
      fontSize: 18,
      colorScheme: "green",
    });
  }

  /**
   * Advanced API Client with Caching and Optimistic Updates
   */
  static advancedApiExample() {
    const api = BinaryJSApiClient.getInstance();

    // Query with caching
    const userQuery = api.query<UserProfile>("user/profile", {
      cacheTime: 5 * 60 * 1000, // 5 minutes
      staleTime: 60 * 1000, // 1 minute
      retry: 3,
    });

    // Mutation with optimistic update
    const updateProfile = api.mutate(
      "user/profile",
      {
        name: "John Doe",
        email: "john@example.com",
      },
      {
        optimisticUpdate: true,
        onSuccess: (data: UserProfile) => {
          const state = BinaryJSState.getInstance();
          state.setState("user", data);
        },
        onError: (error: Error) => {
          console.error("Update failed:", error);
        },
      }
    );

    // Batch mutations
    const batchUpdate = api.batch([
      {
        endpoint: "user/profile",
        data: { name: "John" },
      },
      {
        endpoint: "user/settings",
        data: { theme: "dark" },
      },
    ]);
  }

  /**
   * Run all advanced examples
   */
  static runAllExamples() {
    console.log("=== Complex Component Example ===");
    this.complexComponentExample();

    console.log("\n=== Advanced Routing Example ===");
    this.advancedRoutingExample();

    console.log("\n=== Advanced State Example ===");
    this.advancedStateExample();

    console.log("\n=== Advanced API Example ===");
    this.advancedApiExample();
  }
}

// Run all examples
BinaryJSAdvancedExamples.runAllExamples();
