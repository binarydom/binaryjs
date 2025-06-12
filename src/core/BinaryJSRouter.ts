export class BinaryJSRouter {
  private routes: Map<string, () => Promise<any>> = new Map();

  addRoute(path: string, component: () => Promise<any>): void {
    this.routes.set(path, component);
  }

  navigate(path: string): void {
    const component = this.routes.get(path);
    if (component) {
      component();
    }
  }
}
