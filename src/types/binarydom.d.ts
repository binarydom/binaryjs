declare module "binarydom" {
  export interface BinaryDOMNode {
    type: string | Function;
    id: string;
    props: {
      className?: string;
      children?: BinaryDOMNode[];
      value?: string;
      [key: string]: any;
    };
    attributes: Map<string, string>;
    children: BinaryDOMNode[];
    left: BinaryDOMNode | null;
    right: BinaryDOMNode | null;
    checksum: number;
    isDirty: boolean;
    parent: BinaryDOMNode | null;
    eventHandlers: Map<string, Function>;
    state: any;
    hooks: any[];
    tagName?: string;
    value?: string;
  }

  export class BinaryDOMRenderer {
    constructor(root: HTMLElement);
    render(node: BinaryDOMNode): void;
    renderToString(node: BinaryDOMNode): string;
    hydrate(node: BinaryDOMNode, container: HTMLElement): void;
  }

  export abstract class BinaryDOMComponent {
    protected state: Map<string, any>;
    protected props: any;
    abstract render(): BinaryDOMNode;
    update(): void;
  }

  export abstract class ServerComponent extends BinaryDOMComponent {
    protected getDependencies(): string[];
  }
}
