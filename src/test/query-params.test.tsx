import { expect } from "chai";
import { JSDOM } from "jsdom";
import { match } from "../index.js";
import { setupJSDOM } from "./setup.js";

describe("Query Parameters", () => {
  let dom: JSDOM;

  beforeEach(() => {
    dom = setupJSDOM();
  });

  afterEach(() => {
    dom.window.close();
  });

  it("should parse query parameters", () => {
    window.history.pushState({}, "", "/search?q=test&sort=desc");

    let extractedQuery: any;
    match("/search", (params, query) => {
      extractedQuery = query;
      return <div />;
    });

    expect(extractedQuery).to.deep.equal({
      q: "test",
      sort: "desc"
    });
  });

  it("should handle routes with both path params and query strings", () => {
    window.history.pushState({}, "", "/users/123?tab=profile&view=detailed");

    let extractedData: any = {};
    match("/users/:id", (params, query) => {
      extractedData = { params, query };
      return <div />;
    });

    expect(extractedData.params).to.deep.equal({ id: "123" });
    expect(extractedData.query).to.deep.equal({
      tab: "profile",
      view: "detailed"
    });
  });

  it("should provide empty object for query when no query string exists", () => {
    window.history.pushState({}, "", "/users/123");

    let extractedQuery: any;
    match("/users/:id", (params, query) => {
      extractedQuery = query;
      return <div />;
    });

    expect(extractedQuery).to.deep.equal({});
  });

  it("should handle empty query values", () => {
    window.history.pushState({}, "", "/search?q=&sort=");

    let query: any;
    match("/search", (_, q) => {
      query = q;
      return <div />;
    });

    expect(query).to.deep.equal({ q: "", sort: "" });
  });
});