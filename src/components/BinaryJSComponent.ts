import { BinaryDOMNode } from "binarydom";
import { BinaryJSState } from "../core/BinaryJSState";
import { BinaryJSHooks } from "../core/BinaryJSHooks";

export abstract class BinaryJSComponent<P = {}, S = {}> {
  protected props: P;
  protected state: S;
  protected refs: { [key: string]: HTMLElement | null } = {};
  protected hooks: BinaryJSHooks;
  protected stateManager: BinaryJSState;
  private isMounted: boolean = false;
  private updateQueue: Set<string> = new Set();
  private isBatching: boolean = false;

  constructor(props: P) {
    this.props = props;
    this.state = {} as S;
    this.hooks = new BinaryJSHooks();
    this.stateManager = BinaryJSState.getInstance();
  }

  // Lifecycle methods
  protected componentWillMount(): void {}
  protected componentDidMount(): void {}
  protected componentWillUnmount(): void {}
  protected componentWillUpdate(nextProps: P, nextState: S): void {}
  protected componentDidUpdate(prevProps: P, prevState: S): void {}
  protected shouldComponentUpdate(nextProps: P, nextState: S): boolean {
    return true;
  }

  // State management
  protected setState(partialState: Partial<S>): void {
    const startTime = performance.now();

    if (this.isBatching) {
      this.updateQueue.add("state");
      return;
    }

    this.isBatching = true;
    requestAnimationFrame(() => {
      const nextState = { ...this.state, ...partialState };

      if (this.shouldComponentUpdate(this.props, nextState)) {
        this.componentWillUpdate(this.props, nextState);
        this.state = nextState;
        this.forceUpdate();
        this.componentDidUpdate(this.props, this.state);
      }

      this.isBatching = false;
      this.updateQueue.clear();

      // Track performance
      const endTime = performance.now();
      console.debug(`State update took ${endTime - startTime}ms`);
    });
  }

  // Force update
  protected forceUpdate(): void {
    if (!this.isMounted) return;

    const startTime = performance.now();
    const newElement = this.render();
    // Update the tree (implementation connected to BinaryDOMRenderer)
    this.update(newElement);

    // Track performance
    const endTime = performance.now();
    console.debug(`Force update took ${endTime - startTime}ms`);
  }

  // Abstract methods
  public abstract render(): BinaryDOMNode;
  protected abstract update(newElement: BinaryDOMNode): void;

  // Hook system
  protected useHook<T>(
    hookType: string,
    initialValue: T
  ): [T, (value: T) => void] {
    return this.hooks.useHook(hookType, initialValue);
  }

  // Ref system
  protected createRef<T extends HTMLElement>(): { current: T | null } {
    return { current: null };
  }

  // Event handling
  protected handleEvent = (event: Event): void => {
    const startTime = performance.now();

    // Process event
    this.processEvent(event);

    // Track performance
    const endTime = performance.now();
    console.debug(`Event handling took ${endTime - startTime}ms`);
  };

  private processEvent(event: Event): void {
    // Event processing logic
  }

  // Mounting
  public mount(): void {
    if (this.isMounted) return;

    this.componentWillMount();
    this.isMounted = true;
    this.forceUpdate();
    this.componentDidMount();
  }

  // Unmounting
  public unmount(): void {
    if (!this.isMounted) return;

    this.componentWillUnmount();
    this.isMounted = false;
    this.cleanup();
  }

  private cleanup(): void {
    // Cleanup logic
    this.refs = {};
    this.updateQueue.clear();
  }
}
