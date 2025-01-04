# Webjsx Router

A minimal, type-safe pattern matching router for webjsx with zero dependencies. Ideal for building web components with declarative routing.

## Installation

```bash
npm install webjsx-router
```

## Features

- Lightweight and fast pattern matching
- Full TypeScript support with type inference
- URL parameter extraction
- Query string parsing
- Trailing slash handling
- Chain multiple routes with fallbacks
- No external dependencies

## Usage

Use the `match` function directly in your render methods to handle different routes:

```ts
import { match } from "webjsx-router";

function render() {
  return (
    match("/users/:id", (params, query) => (
      <user-details id={params.id} tab={query.tab} />
    )) ||
    match("/users", () => <user-list />) || <not-found />
  );
}
```

### URL Patterns

The router supports URL patterns with named parameters:

```ts
// Static routes
match("/about", () => <about-page />);

// Single parameter
match("/users/:id", (params) => <user-details id={params.id} />);

// Multiple parameters
match("/org/:orgId/users/:userId", (params) => (
  <org-user orgId={params.orgId} userId={params.userId} />
));
```

### Query Parameters

Query strings are automatically parsed and provided to your render function:

```ts
// URL: /search?q=test&sort=desc
match("/search", (params, query) => {
  query.q; // "test"
  query.sort; // "desc"
  return <search-results query={query.q} sort={query.sort} />;
});
```

### Type Safety

The router provides full TypeScript support with automatic type inference:

```ts
// Parameters are fully typed
match("/users/:userId/posts/:postId", (params) => {
  params.userId; // typed as string
  params.postId; // typed as string
  return <user-post {...params} />;
});

// Query parameters are typed as Record<string, string>
match("/users", (params, query) => {
  query.page; // typed as string | undefined
  return <user-list page={query.page} />;
});
```

### Route Chaining

Chain multiple routes with the OR operator (`||`). The last route acts as a fallback:

```ts
function render() {
  return (
    match("/users/:id", (params) => <user-details id={params.id} />) ||
    match("/users", () => <user-list />) ||
    match("/about", () => <about-page />) || <not-found /> // Fallback route
  );
}
```

## License

MIT
