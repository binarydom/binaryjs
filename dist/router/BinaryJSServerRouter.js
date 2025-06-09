import { BinaryJSRouter } from './BinaryJSRouter';
/**
 * Server-side router handler with advanced features
 */
export class BinaryJSServerRouter {
    constructor(routes) {
        this.router = BinaryJSRouter.getInstance(true);
        this.routes = routes;
        this.initialize();
    }
    initialize() {
        this.router.registerRoutes(this.routes);
    }
    /**
     * Handles incoming requests with advanced features
     */
    async handleRequest(req, res) {
        try {
            // Handle preflight requests
            if (req.method === 'OPTIONS') {
                res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
                res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
                res.status(200).end();
                return;
            }
            // Get the path from the request
            const path = req.path;
            // Check if the route exists
            const route = this.routes.find(r => this.matchRoute(r.path, path));
            if (!route) {
                res.status(404).send('Route not found');
                return;
            }
            // Render the route
            const html = await this.router.navigate(path);
            // Set appropriate headers
            res.setHeader('Content-Type', 'text/html');
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
            // Send the response
            res.send(html);
        }
        catch (error) {
            console.error('Error handling request:', error);
            res.status(500).send('Internal Server Error');
        }
    }
    /**
     * Matches a route pattern against a path
     */
    matchRoute(pattern, path) {
        const patternParts = pattern.split('/');
        const pathParts = path.split('/');
        if (patternParts.length !== pathParts.length) {
            return false;
        }
        return patternParts.every((part, index) => {
            if (part.startsWith(':')) {
                return true;
            }
            return part === pathParts[index];
        });
    }
    /**
     * Creates an Express middleware
     */
    createMiddleware() {
        return (req, res, next) => {
            this.handleRequest(req, res).catch(next);
        };
    }
}
/**
 * Example usage of the server router
 */
const routes = [
    {
        path: '/',
        component: HomeComponent,
        data: async () => {
            // Fetch data for the home page
            return { welcome: 'Welcome to BinaryJS' };
        },
        cache: {
            enabled: true,
            ttl: 5000 // Cache for 5 seconds
        }
    },
    {
        path: '/users/:id',
        component: UserComponent,
        middleware: [
            async (context) => {
                // Check if user is authenticated
                return true;
            }
        ],
        data: async () => {
            // Fetch user data
            return { user: { name: 'John Doe' } };
        }
    }
];
// Create the server router
const serverRouter = new BinaryJSServerRouter(routes);
// Use with Express
app.use(serverRouter.createMiddleware());
