import { BinaryJS } from './index';

describe('BinaryJS', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should render a component', () => {
    const binaryjs = new BinaryJS(container);
    const component = BinaryJS.createExampleComponent();
    binaryjs.render(component);

    const renderedElement = container.querySelector('.example-component');
    expect(renderedElement).toBeTruthy();
    expect(renderedElement?.textContent).toBe('Hello from BinaryJS!');
  });
}); 