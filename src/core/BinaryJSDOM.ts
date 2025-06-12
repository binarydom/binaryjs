import { BinaryDOMNode } from "binarydom";

export class BinaryJSDOM {
  createElement(tagName: string, props: any = {}): BinaryDOMNode {
    return {
      type: "element",
      tagName,
      id: `${tagName}-${Math.random()}`,
      props,
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

  createTextNode(value: string): BinaryDOMNode {
    return {
      type: "text",
      id: `text-${Math.random()}`,
      value,
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
    };
  }

  appendChild(parent: BinaryDOMNode, child: BinaryDOMNode): void {
    parent.children.push(child);
  }

  setAttribute(element: BinaryDOMNode, key: string, value: string): void {
    element.attributes.set(key, value);
  }

  batchUpdate(callback: () => void): void {
    callback();
  }

  diff(oldTree: BinaryDOMNode, newTree: BinaryDOMNode): any[] {
    return [];
  }

  applyPatches(patches: any[]): void {
    // Apply patches
  }
}
