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
- Handles browser navigation events

## Usage

Initialize the router with a root container and render function:

```ts
import { match, goto, initRouter } from "webjsx-router";
import * as webjsx from "webjsx";

// Initialize router with routing logic
const container = document.getElementById("app")!;
initRouter(
  container,
  () =>
    match("/users/:id", (params) => (
      <user-details id={params.id} onBack={() => goto("/users")} />
    )) ||
    match("/users", () => <user-list />) || <not-found />
);
```

### Navigation

Use the `goto` function to navigate between routes:

```ts
import { goto } from "webjsx-router";

// Simple navigation
goto("/users");

// With query parameters
goto("/search", { q: "test", sort: "desc" });
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
match("/users/:id", (params) => <user-details id={params.id} />) ||
  match("/users", () => <user-list />) ||
  match("/about", () => <about-page />) || <not-found />; // Fallback route
```

### Browser Navigation

The router automatically handles browser back/forward navigation and updates the view accordingly. No additional setup required.

### Complete HTML Example

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Webjsx Router Example</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module">
      import { match, goto, initRouter } from "webjsx-router";
      import * as webjsx from "webjsx";

      // Define custom elements
      class UserList extends HTMLElement {
        connectedCallback() {
          webjsx.applyDiff(
            this,
            <div>
              <h1>Users</h1>
              <button onclick={() => goto("/users/1")}>View User 1</button>
              <button onclick={() => goto("/users/2")}>View User 2</button>
            </div>
          );
        }
      }

      class UserDetails extends HTMLElement {
        static get observedAttributes() {
          return ["id"];
        }

        connectedCallback() {
          this.render();
        }

        attributeChangedCallback() {
          this.render();
        }

        render() {
          const id = this.getAttribute("id");
          webjsx.applyDiff(
            this,
            <div>
              <h1>User {id}</h1>
              <button onclick={() => goto("/users")}>Back to List</button>
            </div>
          );
        }
      }

      class NotFound extends HTMLElement {
        connectedCallback() {
          webjsx.applyDiff(
            this,
            <div>
              <h1>404 Not Found</h1>
              <button onclick={() => goto("/users")}>Go to Users</button>
            </div>
          );
        }
      }

      customElements.define("user-list", UserList);
      customElements.define("user-details", UserDetails);
      customElements.define("not-found", NotFound);

      // Initialize router with routing logic
      const container = document.getElementById("app");
      initRouter(
        container,
        () =>
          match("/users/:id", (params) => <user-details id={params.id} />) ||
          match("/users", () => <user-list />) || <not-found />
      );
    </script>
  </body>
</html>
```

## License

MIT
