import { expect } from "chai";
import { Bloom } from "../index.js";
import "./setup.js";
import { setupJSDOM } from "./setup.js";
import * as webjsx from "webjsx";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

describe("BloomComponent", () => {
  let bloom: Bloom;

  beforeEach(() => {
    setupJSDOM();
    const appElement = document.createElement("div");
    appElement.id = "app";
    document.body.appendChild(appElement);
    bloom = new Bloom(appElement);
  });

  afterEach(() => {
    window.close();
  });

  it("should create a custom element with the specified name", () => {
    bloom.component("test-component", async function* (component, attributes) {
      yield <div>Test Component</div>;
    });

    const element = document.createElement("test-component");
    document.body.appendChild(element);

    expect(element).to.be.instanceOf(HTMLElement);
    expect(element.tagName.toLowerCase()).to.equal("test-component");
  });

  it("should automatically prefix component name if no hyphen provided", () => {
    bloom.component("test", async function* (component, attributes) {
      yield <div>Test Component</div>;
    });

    const element = document.createElement("bloom-test");
    document.body.appendChild(element);

    expect(element).to.be.instanceOf(HTMLElement);
    expect(element.tagName.toLowerCase()).to.equal("bloom-test");
  });

  it("should render content from generator", async () => {
    bloom.component("test-content", async function* (component, attributes) {
      yield <div class="content">Generated Content</div>;
    });

    const element = document.createElement("test-content");
    document.body.appendChild(element);

    // Wait for component to render
    await new Promise((resolve) => setTimeout(resolve, 0));

    const content = element.querySelector(".content");
    expect(content).to.not.be.null;
    expect(content!.textContent).to.equal("Generated Content");
  });

  it("should support shadow DOM", async () => {
    bloom.component(
      "shadow-test",
      async function* (component, attributes) {
        yield <div class="shadow-content">Shadow Content</div>;
      },
      { shadow: "open" }
    );

    const element = document.createElement("shadow-test");
    document.body.appendChild(element);

    // Wait for component to render
    await new Promise((resolve) => setTimeout(resolve, 0));

    const shadowRoot = element.shadowRoot;
    expect(shadowRoot).to.not.be.null;

    const content = shadowRoot!.querySelector(".shadow-content");
    expect(content).to.not.be.null;
    expect(content!.textContent).to.equal("Shadow Content");
  });

  it("should pass all attributes as object to generator", async () => {
    let receivedAttributes: Record<string, string> | null = null;

    bloom.component("attr-test", async function* (component, attributes) {
      receivedAttributes = attributes;
      yield <div>Test</div>;
    });

    const element = document.createElement("attr-test");
    element.setAttribute("foo", "bar");
    element.setAttribute("hello", "world");
    document.body.appendChild(element);

    // Wait for component to render
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(receivedAttributes).to.deep.equal({
      foo: "bar",
      hello: "world",
    });
  });

  it("should update attributes object when attributes change", async () => {
    let receivedAttributes: Record<string, string>[] = [];

    bloom.component(
      "attr-update-test",
      async function* (component, attributes) {
        receivedAttributes.push({ ...attributes });
        yield <div>Test</div>;
      },
      {
        observedAttributes: ["foo"],
      }
    );

    const element = document.createElement("attr-update-test");
    element.setAttribute("foo", "bar");
    document.body.appendChild(element);

    await new Promise((resolve) => setTimeout(resolve, 0));
    element.setAttribute("foo", "baz");
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(receivedAttributes).to.deep.equal([{ foo: "bar" }, { foo: "baz" }]);
  });

  it("should clean up when disconnected", async () => {
    let renderCount = 0;

    bloom.component("cleanup-test", async function* (component, attributes) {
      while (true) {
        renderCount++;
        yield <div>Render {renderCount}</div>;
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    });

    const element = document.createElement("cleanup-test");
    document.body.appendChild(element);

    // Wait for some renders
    await new Promise((resolve) => setTimeout(resolve, 30));

    // Remove element
    element.remove();

    // Store current count
    const countAtRemoval = renderCount;

    // Wait to ensure no more renders
    await new Promise((resolve) => setTimeout(resolve, 30));

    expect(renderCount).to.equal(countAtRemoval);
  });

  it("should maintain state between renders", async () => {
    let renderCount = 0;

    bloom.component("state-test", async function* (component, attributes) {
      let count = 0;

      const increment = () => {
        count++;
        renderCount++;
        component.render();
      };

      while (true) {
        yield (
          <div>
            <span data-testid="count">{count}</span>
            <button onclick={increment} data-testid="button">
              Increment
            </button>
          </div>
        );
      }
    });

    const element = document.createElement("state-test");
    document.body.appendChild(element);

    // Wait for initial render
    await new Promise((resolve) => setTimeout(resolve, 0));

    const getCount = () =>
      element.querySelector('[data-testid="count"]')!.textContent;
    const button = element.querySelector(
      '[data-testid="button"]'
    ) as HTMLElement;

    expect(getCount()).to.equal("0");

    button.click();
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(getCount()).to.equal("1");

    button.click();
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(getCount()).to.equal("2");

    expect(renderCount).to.equal(2);
  });

  it("should handle multiple interactive elements", async () => {
    bloom.component(
      "multi-interactive",
      async function* (component, attributes) {
        let count = 0;
        let text = "";

        const increment = () => {
          count++;
          component.render();
        };

        const updateText = (e: Event) => {
          text = (e.target as HTMLInputElement).value;
          component.render();
        };

        while (true) {
          yield (
            <div>
              <span data-testid="count">{count}</span>
              <button onclick={increment} data-testid="button">
                +
              </button>
              <input
                type="text"
                value={text}
                oninput={updateText}
                data-testid="input"
              />
              <span data-testid="text">{text}</span>
            </div>
          );
        }
      }
    );

    const element = document.createElement("multi-interactive");
    document.body.appendChild(element);

    await new Promise((resolve) => setTimeout(resolve, 0));

    const getCount = () =>
      element.querySelector('[data-testid="count"]')!.textContent;
    const getText = () =>
      element.querySelector('[data-testid="text"]')!.textContent;
    const button = element.querySelector(
      '[data-testid="button"]'
    ) as HTMLElement;
    const input = element.querySelector(
      '[data-testid="input"]'
    ) as HTMLInputElement;

    expect(getCount()).to.equal("0");
    expect(getText()).to.equal("");

    button.click();
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(getCount()).to.equal("1");

    input.value = "Hello";
    input.dispatchEvent(new Event("input"));
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(getText()).to.equal("Hello");

    button.click();
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(getCount()).to.equal("2");
    expect(getText()).to.equal("Hello");
  });

  it("should handle nested components with independent state", async () => {
    bloom.component("child-counter", async function* (component, attributes) {
      let count = parseInt(attributes.initialCount || "0");

      const increment = () => {
        count++;
        component.render();
      };

      while (true) {
        yield (
          <div>
            <span data-testid={`count-${attributes.id}`}>{count}</span>
            <button onclick={increment} data-testid={`button-${attributes.id}`}>
              +
            </button>
          </div>
        );
      }
    });

    bloom.component(
      "parent-component",
      async function* (component, attributes) {
        let parentCount = 0;

        const incrementParent = () => {
          parentCount++;
          component.render();
        };

        while (true) {
          yield (
            <div>
              <span data-testid="parent-count">{parentCount}</span>
              <button onclick={incrementParent} data-testid="parent-button">
                +
              </button>
              <child-counter id="1" initialCount="0" />
              <child-counter id="2" initialCount="5" />
            </div>
          );
        }
      }
    );

    const element = document.createElement("parent-component");
    document.body.appendChild(element);

    await new Promise((resolve) => setTimeout(resolve, 0));

    const getParentCount = () =>
      element.querySelector('[data-testid="parent-count"]')!.textContent;
    const getChild1Count = () =>
      element.querySelector('[data-testid="count-1"]')!.textContent;
    const getChild2Count = () =>
      element.querySelector('[data-testid="count-2"]')!.textContent;

    const parentButton = element.querySelector(
      '[data-testid="parent-button"]'
    ) as HTMLElement;
    const child1Button = element.querySelector(
      '[data-testid="button-1"]'
    ) as HTMLElement;
    const child2Button = element.querySelector(
      '[data-testid="button-2"]'
    ) as HTMLElement;

    expect(getParentCount()).to.equal("0");
    expect(getChild1Count()).to.equal("0");
    expect(getChild2Count()).to.equal("5");

    parentButton.click();
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(getParentCount()).to.equal("1");
    expect(getChild1Count()).to.equal("0");
    expect(getChild2Count()).to.equal("5");

    child1Button.click();
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(getParentCount()).to.equal("1");
    expect(getChild1Count()).to.equal("1");
    expect(getChild2Count()).to.equal("5");

    child2Button.click();
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(getParentCount()).to.equal("1");
    expect(getChild1Count()).to.equal("1");
    expect(getChild2Count()).to.equal("6");
  });

  it("should update child component when parent passes new attributes", async () => {
    // Child component that displays passed attributes
    bloom.component(
      "display-attrs",
      async function* (component, attributes) {
        while (true) {
          yield (
            <div>
              <span data-testid="name">{attributes.name}</span>
              <span data-testid="value">{attributes.value}</span>
            </div>
          );
        }
      },
      {
        observedAttributes: ["name", "value"], // Important: declare which attributes to observe
      }
    );

    // Parent component that updates child attributes
    bloom.component("parent-updater", async function* (component, attributes) {
      let currentValue = 0;

      const updateValue = () => {
        currentValue++;
        component.render();
      };

      while (true) {
        yield (
          <div>
            <display-attrs
              name="counter"
              value={currentValue.toString()}
              data-testid="display"
            />
            <button onclick={updateValue} data-testid="update">
              Update
            </button>
          </div>
        );
      }
    });

    // Create and mount parent component
    const element = document.createElement("parent-updater");
    document.body.appendChild(element);

    // Wait for initial render
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Get child component
    const childElement = element.querySelector('[data-testid="display"]')!;

    // Get elements and verify initial state
    const getName = () =>
      childElement.querySelector('[data-testid="name"]')!.textContent;
    const getValue = () =>
      childElement.querySelector('[data-testid="value"]')!.textContent;
    const button = element.querySelector(
      '[data-testid="update"]'
    ) as HTMLElement;

    // Verify initial state
    expect(getName()).to.equal("counter");
    expect(getValue()).to.equal("0");

    // Click and verify update
    button.click();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(getValue()).to.equal("1");

    // Click again and verify second update
    button.click();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(getValue()).to.equal("2");
  });
});
