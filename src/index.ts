import { BinaryDOMRenderer, BinaryDOMNode } from 'binarydom';

export class BinaryJS {
  private renderer: BinaryDOMRenderer;

  constructor(container: HTMLElement) {
    this.renderer = new BinaryDOMRenderer(container);
  }

  render(node: BinaryDOMNode) {
    this.renderer.render(node);
  }

  // Example component to test the integration
  static createExampleComponent(): BinaryDOMNode {
    return {
      type: 'element',
      tagName: 'div',
      id: 'example',
      props: {
        className: 'example-component',
        children: [{
          type: 'text',
          id: 'example-text',
          value: 'Hello from BinaryJS!',
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