import { BinaryDOMNode } from "binarydom";

/**
 * Storage types for state persistence
 */
enum StorageType {
  LOCAL = "localStorage",
  SESSION = "sessionStorage",
  COOKIE = "cookie",
  MEMORY = "memory",
}

/**
 * State change event
 */
interface StateChangeEvent<T> {
  key: string;
  oldValue: T | undefined;
  newValue: T;
  timestamp: number;
}

/**
 * State configuration
 */
interface StateConfig {
  storage?: StorageType;
  persist?: boolean;
  ttl?: number; // Time to live in milliseconds
  encryption?: boolean;
  compression?: boolean;
}

/**
 * State store with advanced features
 */
class BinaryJSStore<T extends object> {
  private static instance: BinaryJSStore<any>;
  private state: Map<string, T> = new Map();
  private listeners: Set<(event: StateChangeEvent<T>) => void> = new Set();
  private config: StateConfig;
  private storage: Storage | null = null;
  private encryptionKey: string | null = null;

  private constructor(config: StateConfig = {}) {
    this.config = {
      storage: StorageType.MEMORY,
      persist: false,
      ttl: undefined,
      encryption: false,
      compression: false,
      ...config,
    };

    if (this.config.persist) {
      this.initializeStorage();
    }
  }

  static getInstance<T extends object>(config?: StateConfig): BinaryJSStore<T> {
    if (!BinaryJSStore.instance) {
      BinaryJSStore.instance = new BinaryJSStore<T>(config);
    }
    return BinaryJSStore.instance;
  }

  private initializeStorage(): void {
    switch (this.config.storage) {
      case StorageType.LOCAL:
        this.storage = window.localStorage;
        break;
      case StorageType.SESSION:
        this.storage = window.sessionStorage;
        break;
      case StorageType.COOKIE:
        // Implement cookie storage
        break;
      default:
        this.storage = null;
    }
  }

  private async encrypt(data: string): Promise<string> {
    if (!this.config.encryption || !this.encryptionKey) return data;
    // Implement encryption
    return data;
  }

  private async decrypt(data: string): Promise<string> {
    if (!this.config.encryption || !this.encryptionKey) return data;
    // Implement decryption
    return data;
  }

  private async compress(data: string): Promise<string> {
    if (!this.config.compression) return data;
    // Implement compression
    return data;
  }

  private async decompress(data: string): Promise<string> {
    if (!this.config.compression) return data;
    // Implement decompression
    return data;
  }

  private async persistState(key: string, value: T): Promise<void> {
    if (!this.config.persist || !this.storage) return;

    const data = JSON.stringify(value);
    const processed = await this.compress(await this.encrypt(data));

    if (this.config.ttl) {
      const expiry = Date.now() + this.config.ttl;
      this.storage.setItem(`${key}_expiry`, expiry.toString());
    }

    this.storage.setItem(key, processed);
  }

  private async loadPersistedState(key: string): Promise<T | undefined> {
    if (!this.config.persist || !this.storage) return undefined;

    const data = this.storage.getItem(key);
    if (!data) return undefined;

    if (this.config.ttl) {
      const expiry = parseInt(this.storage.getItem(`${key}_expiry`) || "0");
      if (Date.now() > expiry) {
        this.storage.removeItem(key);
        this.storage.removeItem(`${key}_expiry`);
        return undefined;
      }
    }

    const processed = await this.decrypt(await this.decompress(data));
    return JSON.parse(processed);
  }

  async set(key: string, value: T): Promise<void> {
    const oldValue = this.state.get(key);
    this.state.set(key, value);

    await this.persistState(key, value);

    this.notifyListeners({
      key,
      oldValue,
      newValue: value,
      timestamp: Date.now(),
    });
  }

  async get(key: string): Promise<T | undefined> {
    if (!this.state.has(key) && this.config.persist) {
      const persisted = await this.loadPersistedState(key);
      if (persisted) {
        this.state.set(key, persisted);
      }
    }
    return this.state.get(key);
  }

  async delete(key: string): Promise<void> {
    const oldValue = this.state.get(key);
    this.state.delete(key);

    if (this.config.persist && this.storage) {
      this.storage.removeItem(key);
      this.storage.removeItem(`${key}_expiry`);
    }

    this.notifyListeners({
      key,
      oldValue,
      newValue: undefined as any,
      timestamp: Date.now(),
    });
  }

  addListener(listener: (event: StateChangeEvent<T>) => void): void {
    this.listeners.add(listener);
  }

  removeListener(listener: (event: StateChangeEvent<T>) => void): void {
    this.listeners.delete(listener);
  }

  private notifyListeners(event: StateChangeEvent<T>): void {
    this.listeners.forEach((listener) => listener(event));
  }

  clear(): void {
    this.state.clear();
    if (this.config.persist && this.storage) {
      this.storage.clear();
    }
  }
}

/**
 * Base class for stateful components
 */
export abstract class StatefulComponent {
  protected store: BinaryJSStore<any>;
  protected componentId: string;

  constructor(componentId: string, config?: StateConfig) {
    this.componentId = componentId;
    this.store = BinaryJSStore.getInstance(config);
  }

  abstract render(): Promise<BinaryDOMNode>;

  protected async setState<T>(key: string, value: T): Promise<void> {
    await this.store.set(`${this.componentId}:${key}`, value);
  }

  protected async getState<T>(key: string): Promise<T | undefined> {
    return this.store.get(`${this.componentId}:${key}`);
  }

  protected async deleteState(key: string): Promise<void> {
    await this.store.delete(`${this.componentId}:${key}`);
  }
}

interface UserData {
  name: string;
  email?: string;
  preferences?: Record<string, any>;
}

/**
 * Example usage of the state management system
 */
class UserProfileComponent extends StatefulComponent {
  constructor() {
    super("user-profile", {
      storage: StorageType.LOCAL,
      persist: true,
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      encryption: true,
      compression: true,
    });
  }

  async render(): Promise<BinaryDOMNode> {
    const userData = await this.getState<UserData>("userData");

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
            value: userData?.name || "Loading...",
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

  async updateUserData(data: UserData): Promise<void> {
    await this.setState("userData", data);
  }
}

/**
 * Example of a custom state change listener
 */
class LoggingStateListener {
  onStateChange<T>(event: StateChangeEvent<T>): void {
    console.log(`State changed for key: ${event.key}`, {
      oldValue: event.oldValue,
      newValue: event.newValue,
      timestamp: new Date(event.timestamp),
    });
  }
}

// Example usage:
const userProfile = new UserProfileComponent();
const store = BinaryJSStore.getInstance();

// Add state change listener
store.addListener(new LoggingStateListener().onStateChange);

// Update state
await userProfile.updateUserData({ name: "John Doe" });

// Render component
const renderedNode = await userProfile.render();
