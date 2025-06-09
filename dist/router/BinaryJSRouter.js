import { BinaryDOMRenderer } from 'binarydom';
/**
 * Represents the current route context
 */
export class RouteContext {
    constructor() {
        this.params = new Map();
        this.query = new Map();
        this.data = new Map();
        this.cache = new Map();
    }
    static getInstance() {
        if (!RouteContext.instance) {
            RouteContext.instance = new RouteContext();
        }
        return RouteContext.instance;
    }
    setParam(key, value) {
        this.params.set(key, value);
    }
    getParam(key) {
        return this.params.get(key);
    }
    setQuery(key, value) {
        this.query.set(key, value);
    }
    getQuery(key) {
        return this.query.get(key);
    }
    setData(key, value) {
        this.data.set(key, value);
    }
    getData(key) {
        return this.data.get(key);
    }
    async fetchData(key, fetcher, ttl) {
        const cached = this.cache.get(key);
        if (cached && (!ttl || Date.now() - cached.timestamp < ttl)) {
            return cached.data;
        }
        const data = await fetcher();
        this.cache.set(key, { data, timestamp: Date.now() });
        return data;
    }
    clearCache() {
        this.cache.clear();
    }
}
/**
 * Base class for route components with advanced features
 */
export class RouteComponent {
    constructor() {
        this.state = new Map();
        this.node = null;
        this.context = RouteContext.getInstance();
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
            this.node = newNode;
        }
    }
    async beforeEnter() {
        return true;
    }
    async afterEnter() { }
    async beforeLeave() {
        return true;
    }
    async afterLeave() { }
}
/**
 * Advanced router implementation with server and client support
 */
export class BinaryJSRouter {
    constructor(isServer = false) {
        this.routes = new Map();
        this.currentRoute = null;
        this.renderer = new BinaryDOMRenderer(document.createElement('div'));
        this.history = window.history;
        this.isServer = isServer;
    }
    static getInstance(isServer = false) {
        if (!BinaryJSRouter.instance) {
            BinaryJSRouter.instance = new BinaryJSRouter(isServer);
        }
        return BinaryJSRouter.instance;
    }
    /**
     * Registers a route with the router
     */
    registerRoute(config) {
        this.routes.set(config.path, config);
    }
    /**
     * Registers multiple routes at once
     */
    registerRoutes(configs) {
        configs.forEach(config => this.registerRoute(config));
    }
    /**
     * Navigates to a new route
     */
    async navigate(path, options = {}) {
        const route = this.findRoute(path);
        if (!route) {
            throw new Error(`Route not found: ${path}`);
        }
        if (this.currentRoute) {
            const canLeave = await this.executeBeforeLeave();
            if (!canLeave)
                return;
        }
        const context = RouteContext.getInstance();
        const params = this.extractParams(route.path, path);
        params.forEach((value, key) => context.setParam(key, value));
        const query = this.extractQuery(path);
        query.forEach((value, key) => context.setQuery(key, value));
        if (route.data) {
            const data = await route.data();
            context.setData(route.path, data);
        }
        const canEnter = await this.executeBeforeEnter(route);
        if (!canEnter)
            return;
        this.currentRoute = route;
        if (this.isServer) {
            return this.renderServer(route);
        }
        else {
            this.updateHistory(path, options);
            return this.renderClient(route);
        }
    }
    /**
     * Renders the current route on the server
     */
    async renderServer(route) {
        const Component = route.component;
        const component = new Component();
        const node = component.render();
        return this.renderer.renderToString(node);
    }
    /**
     * Renders the current route on the client
     */
    async renderClient(route) {
        const Component = route.component;
        const component = new Component();
        const node = component.render();
        this.renderer.hydrate(node, document.getElementById('app'));
    }
    /**
     * Finds a route configuration for a given path
     */
    findRoute(path) {
        return this.routes.get(path);
    }
    /**
     * Extracts route parameters from a path
     */
    extractParams(routePath, currentPath) {
        const params = new Map();
        const routeParts = routePath.split('/');
        const pathParts = currentPath.split('/');
        routeParts.forEach((part, index) => {
            if (part.startsWith(':')) {
                const paramName = part.slice(1);
                params.set(paramName, pathParts[index]);
            }
        });
        return params;
    }
    /**
     * Extracts query parameters from a path
     */
    extractQuery(path) {
        const query = new Map();
        const queryString = path.split('?')[1];
        if (queryString) {
            queryString.split('&').forEach(pair => {
                const [key, value] = pair.split('=');
                query.set(key, decodeURIComponent(value));
            });
        }
        return query;
    }
    /**
     * Updates the browser history
     */
    updateHistory(path, options) {
        if (options.replace) {
            this.history.replaceState(options.state, '', path);
        }
        else {
            this.history.pushState(options.state, '', path);
        }
    }
    /**
     * Executes beforeEnter hooks
     */
    async executeBeforeEnter(route) {
        if (route.middleware) {
            for (const middleware of route.middleware) {
                const result = await middleware(RouteContext.getInstance());
                if (!result)
                    return false;
            }
        }
        const Component = route.component;
        const component = new Component();
        return component.beforeEnter();
    }
    /**
     * Executes beforeLeave hooks
     */
    async executeBeforeLeave() {
        if (!this.currentRoute)
            return true;
        const Component = this.currentRoute.component;
        const component = new Component();
        return component.beforeLeave();
    }
}
/**
 * Example usage of the router system
 */
export class HomeComponent extends RouteComponent {
    async beforeEnter() {
        const data = await this.context.fetchData('home-data', async () => {
            const response = await fetch('/api/home');
            return response.json();
        }, 5000); // Cache for 5 seconds
        this.setState('data', data);
        return true;
    }
    render() {
        const data = this.getState('data');
        return {
            type: 'element',
            tagName: 'div',
            id: 'home',
            props: {
                className: 'home-page',
                children: [{
                        type: 'text',
                        id: 'welcome',
                        value: data?.welcome || 'Welcome',
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
