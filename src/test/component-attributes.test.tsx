import { expect } from "chai";
import { Bloom } from "../index.js";
import "./setup.js";
import { setupJSDOM } from "./setup.js";
import "./types.js";

describe("BloomComponent - Attributes", () => {
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
});
