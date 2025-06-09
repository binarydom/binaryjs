import { BinaryDOMNode } from "binarydom";
/**
 * Represents a client-side hydration context
 */
export declare class ClientContext {
    private static instance;
    private hydrationData;
    private componentRegistry;
    private constructor();
    static getInstance(): ClientContext;
    registerComponent(name: string, component: typeof ClientComponent): void;
    getComponent(name: string): typeof ClientComponent | undefined;
    getHydrationData(key: string): any;
}
/**
 * Base class for client-side components with hydration support
 */
export declare abstract class ClientComponent {
    protected context: ClientContext;
    protected state: Map<string, any>;
    protected node: BinaryDOMNode | null;
    constructor();
    protected initializeState(): void;
    abstract render(): BinaryDOMNode;
    protected setState(key: string, value: any): void;
    protected getState(key: string): any;
    protected update(): void;
}
/**
 * Client-side renderer with hydration support
 */
export declare class BinaryJSClient {
    private renderer;
    private context;
    private rootComponent;
    constructor();
    /**
     * Hydrates a component into the DOM
     */
    hydrate(component: ClientComponent, container: HTMLElement): void;
    /**
     * Registers a component for hydration
     */
    registerComponent(name: string, component: typeof ClientComponent): void;
    /**
     * Hydrates all components in the DOM
     */
    hydrateAll(): void;
}
/**
 * Example usage of the client-side hydration system
 */
export declare class UserProfileClientComponent extends ClientComponent {
    render(): BinaryDOMNode;
}
