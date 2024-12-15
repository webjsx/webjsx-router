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
    bloom.component("test-component", async function* (attributes) {
      yield <div>Test Component</div>;
    });

    const element = document.createElement("test-component");
    document.body.appendChild(element);

    expect(element).to.be.instanceOf(HTMLElement);
    expect(element.tagName.toLowerCase()).to.equal("test-component");
  });

  it("should automatically prefix component name if no hyphen provided", () => {
    bloom.component("test", async function* (attributes) {
      yield <div>Test Component</div>;
    });

    const element = document.createElement("bloom-test");
    document.body.appendChild(element);

    expect(element).to.be.instanceOf(HTMLElement);
    expect(element.tagName.toLowerCase()).to.equal("bloom-test");
  });

  it("should render content from generator", async () => {
    bloom.component("test-content", async function* (attributes) {
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
      async function* (attributes) {
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
      // Save only the attributes
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
        // Save only the attributes
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

    bloom.component("cleanup-test", async function* (attributes) {
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

    // Rest of test remains the same
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

    // Rest of test remains the same
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
              <child-counter as any id="1" initialCount="0" />
              <child-counter id="2" initialCount="5" />
            </div>
          );
        }
      }
    );

    // Rest of test remains the same
  });
});
