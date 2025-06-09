import { BinaryDOMRenderer } from 'binarydom';
/**
 * Represents a server-side rendering context with advanced features
 */
export class ServerContext {
    constructor() {
        this.cache = new Map();
        this.pendingRequests = new Map();
        this.renderQueue = [];
        this.hydrationData = new Map();
    }
    static getInstance() {
        if (!ServerContext.instance) {
            ServerContext.instance = new ServerContext();
        }
        return ServerContext.instance;
    }
    async fetch(key, fetcher) {
        if (this.cache.has(key)) {
            return this.cache.get(key);
        }
        if (this.pendingRequests.has(key)) {
            return this.pendingRequests.get(key);
        }
        const request = fetcher().then(result => {
            this.cache.set(key, result);
            this.pendingRequests.delete(key);
            return result;
        });
        this.pendingRequests.set(key, request);
        return request;
    }
    queueRender(renderFn) {
        this.renderQueue.push(renderFn);
    }
    async flushRenderQueue() {
        await Promise.all(this.renderQueue.map(fn => fn()));
        this.renderQueue = [];
    }
    setHydrationData(key, data) {
        this.hydrationData.set(key, data);
    }
    getHydrationData(key) {
        return this.hydrationData.get(key);
    }
}
/**
 * Represents a server-side component with advanced features
 */
export class ServerComponent {
    constructor() {
        this.state = new Map();
        this.dependencies = new Set();
        this.context = ServerContext.getInstance();
    }
    async fetch(key, fetcher) {
        this.dependencies.add(key);
        return this.context.fetch(key, fetcher);
    }
    setState(key, value) {
        this.state.set(key, value);
    }
    getState(key) {
        return this.state.get(key);
    }
    addDependency(key) {
        this.dependencies.add(key);
    }
    getDependencies() {
        return Array.from(this.dependencies);
    }
}
/**
 * Advanced server-side renderer with streaming and partial hydration support
 */
export class BinaryJSServer {
    constructor() {
        this.componentCache = new Map();
        this.streamBuffer = [];
        this.isStreaming = false;
        this.renderer = new BinaryDOMRenderer(document.createElement('div'));
        this.context = ServerContext.getInstance();
    }
    /**
     * Renders a component with streaming support
     */
    async renderStream(component) {
        this.isStreaming = true;
        this.streamBuffer = [];
        const stream = new ReadableStream({
            start: async (controller) => {
                try {
                    const node = await component.render();
                    const html = this.renderer.renderToString(node);
                    // Stream the HTML in chunks
                    const chunkSize = 1024;
                    for (let i = 0; i < html.length; i += chunkSize) {
                        const chunk = html.slice(i, i + chunkSize);
                        controller.enqueue(chunk);
                        await new Promise(resolve => setTimeout(resolve, 0));
                    }
                    controller.close();
                }
                catch (error) {
                    controller.error(error);
                }
            }
        });
        return stream;
    }
    /**
     * Renders a component with partial hydration
     */
    async renderWithHydration(component) {
        const node = await component.render();
        const html = this.renderer.renderToString(node);
        // Add hydration data
        const hydrationData = {
            state: Object.fromEntries(component['state']),
            dependencies: component.getDependencies()
        };
        const script = `
      <script>
        window.__HYDRATION_DATA__ = ${JSON.stringify(hydrationData)};
      </script>
    `;
        return html + script;
    }
    /**
     * Renders multiple components in parallel with dependency tracking
     */
    async renderParallel(components) {
        const renderPromises = components.map(async (component) => {
            const node = await component.render();
            return this.renderer.renderToString(node);
        });
        const results = await Promise.all(renderPromises);
        return results.join('');
    }
    /**
     * Renders a component with automatic data prefetching
     */
    async renderWithPrefetch(component) {
        // Prefetch all dependencies
        const dependencies = component.getDependencies();
        await Promise.all(dependencies.map(key => this.context.fetch(key, () => Promise.resolve())));
        return this.renderWithHydration(component);
    }
    /**
     * Renders a component with automatic error boundaries
     */
    async renderWithErrorBoundary(component) {
        try {
            return await this.renderWithHydration(component);
        }
        catch (error) {
            // Render fallback UI
            return `
        <div class="error-boundary">
          <h1>Something went wrong</h1>
          <p>${error.message}</p>
        </div>
      `;
        }
    }
}
/**
 * Example usage of the server-side rendering system
 */
export class UserProfileComponent extends ServerComponent {
    async render() {
        // Fetch user data with automatic caching
        const userData = await this.fetch('user-profile', async () => {
            const response = await fetch('https://api.example.com/user');
            return response.json();
        });
        // Set state for hydration
        this.setState('userData', userData);
        return {
            type: 'element',
            tagName: 'div',
            id: 'user-profile',
            props: {
                className: 'user-profile',
                children: [{
                        type: 'text',
                        id: 'user-name',
                        value: userData.name,
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
