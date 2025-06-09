import { BinaryDOMNode } from 'binarydom';
/**
 * Represents a server-side rendering context with advanced features
 */
export declare class ServerContext {
    private static instance;
    private cache;
    private pendingRequests;
    private renderQueue;
    private hydrationData;
    private constructor();
    static getInstance(): ServerContext;
    fetch<T>(key: string, fetcher: () => Promise<T>): Promise<T>;
    queueRender(renderFn: () => Promise<void>): void;
    flushRenderQueue(): Promise<void>;
    setHydrationData(key: string, data: any): void;
    getHydrationData(key: string): any;
}
/**
 * Represents a server-side component with advanced features
 */
export declare abstract class ServerComponent {
    protected context: ServerContext;
    protected state: Map<string, any>;
    protected dependencies: Set<string>;
    constructor();
    abstract render(): Promise<BinaryDOMNode>;
    protected fetch<T>(key: string, fetcher: () => Promise<T>): Promise<T>;
    protected setState(key: string, value: any): void;
    protected getState(key: string): any;
    protected addDependency(key: string): void;
    protected getDependencies(): string[];
}
/**
 * Advanced server-side renderer with streaming and partial hydration support
 */
export declare class BinaryJSServer {
    private renderer;
    private context;
    private componentCache;
    private streamBuffer;
    private isStreaming;
    constructor();
    /**
     * Renders a component with streaming support
     */
    renderStream(component: ServerComponent): Promise<ReadableStream>;
    /**
     * Renders a component with partial hydration
     */
    renderWithHydration(component: ServerComponent): Promise<string>;
    /**
     * Renders multiple components in parallel with dependency tracking
     */
    renderParallel(components: ServerComponent[]): Promise<string>;
    /**
     * Renders a component with automatic data prefetching
     */
    renderWithPrefetch(component: ServerComponent): Promise<string>;
    /**
     * Renders a component with automatic error boundaries
     */
    renderWithErrorBoundary(component: ServerComponent): Promise<string>;
}
/**
 * Example usage of the server-side rendering system
 */
export declare class UserProfileComponent extends ServerComponent {
    render(): Promise<BinaryDOMNode>;
}
