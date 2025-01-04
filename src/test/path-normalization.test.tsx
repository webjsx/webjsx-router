import { expect } from "chai";
import { JSDOM } from "jsdom";
import { match } from "../index.js";
import { setupJSDOM } from "./setup.js";

describe("Path Normalization", () => {
  let dom: JSDOM;

  beforeEach(() => {
    dom = setupJSDOM();
  });

  afterEach(() => {
    dom.window.close();
  });

  it("should handle URLs with hash fragments", () => {
    window.history.pushState({}, "", "/page#section1");

    const result = match("/page", () => <div id="page" />);
    expect(result).to.not.be.undefined;
  });

  it("should handle encoded URI components", () => {
    const encodedPath = "/users/" + encodeURIComponent("john@example.com");
    window.history.pushState({}, "", encodedPath);

    let params: any;
    match("/users/:email", (p) => {
      params = p;
      return <div />;
    });

    expect(params.email).to.equal("john@example.com");
  });

  it("should support nested paths with parameters", () => {
    window.history.pushState({}, "", "/org/123/users/456/profile");

    let extractedParams: any;
    match("/org/:orgId/users/:userId/profile", (params) => {
      extractedParams = params;
      return <div />;
    });

    expect(extractedParams).to.deep.equal({
      orgId: "123",
      userId: "456"
    });
  });
});