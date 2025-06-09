import { BinaryDOMNode } from 'binarydom';
export declare class BinaryJS {
    private renderer;
    constructor(container: HTMLElement);
    render(node: BinaryDOMNode): void;
    static createExampleComponent(): BinaryDOMNode;
}
