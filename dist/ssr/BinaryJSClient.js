import { BinaryDOMRenderer } from "binarydom";
/**
 * Represents a client-side hydration context
 */
export class ClientContext {
    constructor() {
        this.hydrationData = new Map();
        this.componentRegistry = new Map();
        // Initialize hydration data from window
        const data = window.__HYDRATION_DATA__;
        if (data) {
            Object.entries(data).forEach(([key, value]) => {
                this.hydrationData.set(key, value);
            });
        }
    }
    static getInstance() {
        if (!ClientContext.instance) {
            ClientContext.instance = new ClientContext();
        }
        return ClientContext.instance;
    }
    registerComponent(name, component) {
        this.componentRegistry.set(name, component);
    }
    getComponent(name) {
        return this.componentRegistry.get(name);
    }
    getHydrationData(key) {
        return this.hydrationData.get(key);
    }
}
/**
 * Base class for client-side components with hydration support
 */
export class ClientComponent {
    constructor() {
        this.node = null;
        this.context = ClientContext.getInstance();
        this.state = new Map();
        this.initializeState();
    }
    initializeState() {
        const hydrationData = this.context.getHydrationData(this.constructor.name);
        if (hydrationData?.state) {
            Object.entries(hydrationData.state).forEach(([key, value]) => {
                this.state.set(key, value);
            });
        }
    }
    setState(key, value) {
        this.state.set(key, value);
        this.update();
    }
    getState(key) {
        return this.state.get(key);
    }
    update() {
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
    constructor() {
        this.rootComponent = null;
        this.renderer = new BinaryDOMRenderer(document.createElement("div"));
        this.context = ClientContext.getInstance();
    }
    /**
     * Hydrates a component into the DOM
     */
    hydrate(component, container) {
        this.rootComponent = component;
        const node = component.render();
        this.renderer.hydrate(node, container);
    }
    /**
     * Registers a component for hydration
     */
    registerComponent(name, component) {
        this.context.registerComponent(name, component);
    }
    /**
     * Hydrates all components in the DOM
     */
    hydrateAll() {
        const components = document.querySelectorAll("[data-component]");
        components.forEach((element) => {
            const componentName = element.getAttribute("data-component");
            if (componentName) {
                const ComponentClass = this.context.getComponent(componentName);
                if (ComponentClass) {
                    const component = new ComponentClass();
                    this.hydrate(component, element);
                }
            }
        });
    }
}
/**
 * Example usage of the client-side hydration system
 */
export class UserProfileClientComponent extends ClientComponent {
    render() {
        const userData = this.getState("userData");
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
}
