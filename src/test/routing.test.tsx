import { expect } from "chai";
import { Bloom } from "../index.js";
import "./setup.js";
import { setupJSDOM } from "./setup.js";
import * as webjsx from "webjsx";

describe("Bloom Routing", () => {
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

  it("should register a simple route", () => {
    bloom.page("/home", async function* () {
      yield <div />;
    });

    // Access router's routes through the private field
    expect((bloom as any).router.routes).to.have.length(1);
    expect((bloom as any).router.routes[0].pattern).to.equal("/home");
  });

  it("should match a route with no params", async () => {
    bloom.page("/about", async function* () {
      yield <div />;
    });

    const match = (bloom as any).router.matchRoute("/about");
    expect(match).to.not.be.null;
    expect(match!.params).to.deep.equal({});
  });

  it("should match a route with dynamic params", async () => {
    bloom.page("/city/:location", async function* () {
      yield <div />;
    });

    const match = (bloom as any).router.matchRoute("/city/NewYork");
    expect(match).to.not.be.null;
    expect(match!.params).to.deep.equal({ location: "NewYork" });
  });

  it("should not match a non-existent route", async () => {
    bloom.page("/home", async function* () {
      yield <div />;
    });

    const match = (bloom as any).router.matchRoute("/nonexistent");
    expect(match).to.be.null;
  });
});
