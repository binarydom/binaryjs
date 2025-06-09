import { RouteConfig } from './BinaryJSRouter';
import { Request, Response } from 'express';
/**
 * Server-side router handler with advanced features
 */
export declare class BinaryJSServerRouter {
    private router;
    private routes;
    constructor(routes: RouteConfig[]);
    private initialize;
    /**
     * Handles incoming requests with advanced features
     */
    handleRequest(req: Request, res: Response): Promise<void>;
    /**
     * Matches a route pattern against a path
     */
    private matchRoute;
    /**
     * Creates an Express middleware
     */
    createMiddleware(): (req: Request, res: Response, next: Function) => void;
}
