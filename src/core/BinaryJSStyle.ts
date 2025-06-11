import { BinaryDOMNode } from "binarydom";

/**
 * Animation timing functions
 */
enum TimingFunction {
  LINEAR = "linear",
  EASE = "ease",
  EASE_IN = "ease-in",
  EASE_OUT = "ease-out",
  EASE_IN_OUT = "ease-in-out",
  CUBIC_BEZIER = "cubic-bezier",
}

/**
 * Animation configuration
 */
interface AnimationConfig {
  duration: number;
  delay?: number;
  timingFunction?: TimingFunction;
  iterations?: number;
  direction?: "normal" | "reverse" | "alternate" | "alternate-reverse";
  fill?: "none" | "forwards" | "backwards" | "both";
  bezierPoints?: [number, number, number, number];
}

/**
 * Style configuration
 */
interface StyleConfig {
  scope?: "global" | "isolated";
  priority?: number;
  mediaQueries?: Record<string, string>;
  pseudoClasses?: Record<string, string>;
  animations?: Record<string, AnimationConfig>;
  variables?: Record<string, string>;
}

/**
 * Style manager with advanced features
 */
class BinaryJSStyleManager {
  private static instance: BinaryJSStyleManager;
  private styles: Map<string, string> = new Map();
  private animations: Map<string, AnimationConfig> = new Map();
  private styleSheet: CSSStyleSheet | null = null;
  private styleElement: HTMLStyleElement | null = null;
  private animationFrameId: number | null = null;
  private performanceMetrics: Map<string, number> = new Map();

  private constructor() {
    this.initializeStyleSheet();
  }

  static getInstance(): BinaryJSStyleManager {
    if (!BinaryJSStyleManager.instance) {
      BinaryJSStyleManager.instance = new BinaryJSStyleManager();
    }
    return BinaryJSStyleManager.instance;
  }

  private initializeStyleSheet(): void {
    this.styleElement = document.createElement("style");
    document.head.appendChild(this.styleElement);
    this.styleSheet = this.styleElement.sheet as CSSStyleSheet;
  }

  private generateUniqueId(): string {
    return `binary-${Math.random().toString(36).substr(2, 9)}`;
  }

  private measurePerformance(operation: string, callback: () => void): void {
    const start = performance.now();
    callback();
    const end = performance.now();
    this.performanceMetrics.set(operation, end - start);
  }

  addStyle(
    selector: string,
    styles: Record<string, string>,
    config: StyleConfig = {}
  ): string {
    const styleId = this.generateUniqueId();
    const scopedSelector =
      config.scope === "isolated" ? `.${styleId}` : selector;

    this.measurePerformance("addStyle", () => {
      let css = `${scopedSelector} {`;

      // Add CSS variables
      if (config.variables) {
        Object.entries(config.variables).forEach(([key, value]) => {
          css += `--${key}: ${value};`;
        });
      }

      // Add styles
      Object.entries(styles).forEach(([property, value]) => {
        css += `${property}: ${value};`;
      });

      css += "}";

      // Add media queries
      if (config.mediaQueries) {
        Object.entries(config.mediaQueries).forEach(([query, styles]) => {
          css += `@media ${query} { ${scopedSelector} { ${styles} } }`;
        });
      }

      // Add pseudo-classes
      if (config.pseudoClasses) {
        Object.entries(config.pseudoClasses).forEach(([pseudo, styles]) => {
          css += `${scopedSelector}:${pseudo} { ${styles} }`;
        });
      }

      // Add animations
      if (config.animations) {
        Object.entries(config.animations).forEach(([name, animation]) => {
          this.addAnimation(name, animation);
        });
      }

      this.styles.set(styleId, css);
      this.styleSheet?.insertRule(css, this.styleSheet.cssRules.length);
    });

    return styleId;
  }

  addAnimation(name: string, config: AnimationConfig): void {
    this.measurePerformance("addAnimation", () => {
      let keyframes = `@keyframes ${name} {`;

      if (
        config.timingFunction === TimingFunction.CUBIC_BEZIER &&
        config.bezierPoints
      ) {
        const [x1, y1, x2, y2] = config.bezierPoints;
        keyframes += `animation-timing-function: cubic-bezier(${x1}, ${y1}, ${x2}, ${y2});`;
      } else if (config.timingFunction) {
        keyframes += `animation-timing-function: ${config.timingFunction};`;
      }

      this.animations.set(name, config);
      this.styleSheet?.insertRule(keyframes, this.styleSheet.cssRules.length);
    });
  }

  applyAnimation(element: HTMLElement, animationName: string): void {
    const animation = this.animations.get(animationName);
    if (!animation) return;

    this.measurePerformance("applyAnimation", () => {
      element.style.animation = `${animationName} ${animation.duration}ms ${animation.timingFunction || TimingFunction.LINEAR} ${animation.delay || 0}ms ${animation.iterations || 1} ${animation.direction || "normal"} ${animation.fill || "none"}`;
    });
  }

  removeStyle(styleId: string): void {
    this.measurePerformance("removeStyle", () => {
      const css = this.styles.get(styleId);
      if (!css) return;

      const rules = Array.from(this.styleSheet?.cssRules || []);
      const index = rules.findIndex((rule) => rule.cssText === css);
      if (index !== -1) {
        this.styleSheet?.deleteRule(index);
      }

      this.styles.delete(styleId);
    });
  }

  getPerformanceMetrics(): Record<string, number> {
    return Object.fromEntries(this.performanceMetrics);
  }

  cleanup(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.styleElement) {
      document.head.removeChild(this.styleElement);
    }
    this.styles.clear();
    this.animations.clear();
    this.performanceMetrics.clear();
  }
}

/**
 * Base class for styled components
 */
export abstract class StyledComponent {
  protected styleManager: BinaryJSStyleManager;
  protected styleId: string | null = null;

  constructor() {
    this.styleManager = BinaryJSStyleManager.getInstance();
  }

  abstract render(): Promise<BinaryDOMNode>;

  protected addStyle(
    styles: Record<string, string>,
    config: StyleConfig = {}
  ): string {
    this.styleId = this.styleManager.addStyle(
      this.constructor.name,
      styles,
      config
    );
    return this.styleId;
  }

  protected applyAnimation(element: HTMLElement, animationName: string): void {
    this.styleManager.applyAnimation(element, animationName);
  }

  protected removeStyle(): void {
    if (this.styleId) {
      this.styleManager.removeStyle(this.styleId);
    }
  }
}

/**
 * Example usage of the styling system
 */
class AnimatedButton extends StyledComponent {
  constructor() {
    super();
    this.initializeStyles();
  }

  private initializeStyles(): void {
    // Add base styles
    this.addStyle(
      {
        padding: "10px 20px",
        borderRadius: "4px",
        backgroundColor: "var(--primary-color, #007bff)",
        color: "white",
        border: "none",
        cursor: "pointer",
        transition: "transform 0.2s ease",
      },
      {
        scope: "isolated",
        variables: {
          "primary-color": "#007bff",
          "hover-color": "#0056b3",
        },
        pseudoClasses: {
          hover:
            "background-color: var(--hover-color); transform: scale(1.05);",
          active: "transform: scale(0.95);",
        },
        animations: {
          pulse: {
            duration: 1000,
            timingFunction: TimingFunction.EASE_IN_OUT,
            iterations: 2,
            direction: "alternate",
          },
        },
      }
    );
  }

  async render(): Promise<BinaryDOMNode> {
    return {
      type: "element",
      tagName: "button",
      id: "animated-button",
      props: {
        className: "animated-button",
        children: [
          {
            type: "text",
            id: "button-text",
            value: "Click Me",
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

  animate(element: HTMLElement): void {
    this.applyAnimation(element, "pulse");
  }
}

// Example usage:
const button = new AnimatedButton();
const renderedNode = await button.render();

// Later, animate the button
const buttonElement = document.getElementById("animated-button");
if (buttonElement) {
  button.animate(buttonElement);
}

// Get performance metrics
const styleManager = BinaryJSStyleManager.getInstance();
console.log("Performance metrics:", styleManager.getPerformanceMetrics());
