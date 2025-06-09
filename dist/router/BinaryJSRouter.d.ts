import { BinaryDOMNode } from 'binarydom';
/**
 * Represents a route configuration with advanced features
 */
export interface RouteConfig {
    path: string;
    component: typeof RouteComponent;
    children?: RouteConfig[];
    middleware?: RouteMiddleware[];
    data?: () => Promise<any>;
    cache?: {
        enabled: boolean;
        ttl?: number;
    };
}
/**
 * Represents a route middleware function
 */
export type RouteMiddleware = (context: RouteContext) => Promise<boolean>;
/**
 * Represents the current route context
 */
export declare class RouteContext {
    private static instance;
    private params;
    private query;
    private data;
    private cache;
    private constructor();
    static getInstance(): RouteContext;
    setParam(key: string, value: string): void;
    getParam(key: string): string | undefined;
    setQuery(key: string, value: string): void;
    getQuery(key: string): string | undefined;
    setData(key: string, value: any): void;
    getData(key: string): any;
    fetchData<T>(key: string, fetcher: () => Promise<T>, ttl?: number): Promise<T>;
    clearCache(): void;
}
/**
 * Base class for route components with advanced features
 */
export declare abstract class RouteComponent {
    protected context: RouteContext;
    protected state: Map<string, any>;
    protected node: BinaryDOMNode | null;
    constructor();
    abstract render(): BinaryDOMNode;
    protected setState(key: string, value: any): void;
    protected getState(key: string): any;
    protected update(): void;
    beforeEnter(): Promise<boolean>;
    afterEnter(): Promise<void>;
    beforeLeave(): Promise<boolean>;
    afterLeave(): Promise<void>;
}
/**
 * Advanced router implementation with server and client support
 */
export declare class BinaryJSRouter {
    private static instance;
    private routes;
    private renderer;
    private currentRoute;
    private history;
    private isServer;
    private constructor();
    static getInstance(isServer?: boolean): BinaryJSRouter;
    /**
     * Registers a route with the router
     */
    registerRoute(config: RouteConfig): void;
    /**
     * Registers multiple routes at once
     */
    registerRoutes(configs: RouteConfig[]): void;
    /**
     * Navigates to a new route
     */
    navigate(path: string, options?: {
        replace?: boolean;
        state?: any;
    }): Promise<string | void>;
    /**
     * Renders the current route on the server
     */
    private renderServer;
    /**
     * Renders the current route on the client
     */
    private renderClient;
    /**
     * Finds a route configuration for a given path
     */
    private findRoute;
    /**
     * Extracts route parameters from a path
     */
    private extractParams;
    /**
     * Extracts query parameters from a path
     */
    private extractQuery;
    /**
     * Updates the browser history
     */
    private updateHistory;
    /**
     * Executes beforeEnter hooks
     */
    private executeBeforeEnter;
    /**
     * Executes beforeLeave hooks
     */
    private executeBeforeLeave;
}
/**
 * Example usage of the router system
 */
export declare class HomeComponent extends RouteComponent {
    beforeEnter(): Promise<boolean>;
    render(): BinaryDOMNode;
}
