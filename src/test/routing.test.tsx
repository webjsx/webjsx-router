import { expect } from "chai";
import { Router } from "../index.js";
import "./setup.js";
import { setupJSDOM } from "./setup.js";

describe("Magic Loop Routing", () => {
  let router: Router;

  beforeEach(() => {
    setupJSDOM();
    const appElement = document.createElement("div");
    appElement.id = "app";
    document.body.appendChild(appElement);
    router = new Router(appElement);
  });

  afterEach(() => {
    window.close();
  });

  it("should register a simple route", () => {
    router.page("/home", async function* () {
      yield <div />;
    });

    // Access router's routes through the private field
    expect((router as any).router.routes).to.have.length(1);
    expect((router as any).router.routes[0].pattern).to.equal("/home");
  });

  it("should match a route with no params", async () => {
    router.page("/about", async function* () {
      yield <div />;
    });

    const match = (router as any).router.matchRoute("/about");
    expect(match).to.not.be.null;
    expect(match!.params).to.deep.equal({});
  });

  it("should match a route with dynamic params", async () => {
    router.page("/city/:location", async function* () {
      yield <div />;
    });

    const match = (router as any).router.matchRoute("/city/NewYork");
    expect(match).to.not.be.null;
    expect(match!.params).to.deep.equal({ location: "NewYork" });
  });

  it("should not match a non-existent route", async () => {
    router.page("/home", async function* () {
      yield <div />;
    });

    const match = (router as any).router.matchRoute("/nonexistent");
    expect(match).to.be.null;
  });
});
