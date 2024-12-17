import { expect } from "chai";
import { Bloom } from "../index.js";
import "./setup.js";
import { setupJSDOM } from "./setup.js";
import * as webjsx from "webjsx";
import "./types.js";

describe("BloomComponent - Nested Components", () => {
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
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(getParentCount()).to.equal("1");
    expect(getChild1Count()).to.equal("0");
    expect(getChild2Count()).to.equal("5");

    child1Button.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(getParentCount()).to.equal("1");
    expect(getChild1Count()).to.equal("1");
    expect(getChild2Count()).to.equal("5");

    child2Button.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(getParentCount()).to.equal("1");
    expect(getChild1Count()).to.equal("1");
    expect(getChild2Count()).to.equal("6");
  });

  it("should update child component when parent passes new attributes", async () => {
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
        observedAttributes: ["name", "value"],
      }
    );

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

    const element = document.createElement("parent-updater");
    document.body.appendChild(element);

    await new Promise((resolve) => setTimeout(resolve, 0));

    const childElement = element.querySelector('[data-testid="display"]')!;

    const getName = () =>
      childElement.querySelector('[data-testid="name"]')!.textContent;
    const getValue = () =>
      childElement.querySelector('[data-testid="value"]')!.textContent;
    const button = element.querySelector(
      '[data-testid="update"]'
    ) as HTMLElement;

    expect(getName()).to.equal("counter");
    expect(getValue()).to.equal("0");

    button.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(getValue()).to.equal("1");

    button.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(getValue()).to.equal("2");
  });
});
