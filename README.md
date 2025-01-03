# Magic Loop Router

A lightweight router for web applications, designed to work seamlessly with Magic Loop and Web Components.
For more information, see [Magic Loop](https://github.com/webjsx/magic-loop)

## Installation

```bash
npm install magic-loop-router
```

## Usage

The router provides a simple API for declaring routes and handling navigation in your web application.

### Basic Setup

```ts
import { Router } from "magic-loop-router";

// Initialize the router with the root element ID
const router = new Router("app");

// Define routes
router.page("/", async function* () {
  return <home-page />;
});

router.page("/user/:id", async function* (params) {
  return <user-profile userid={params.id} />;
});

// Start the router
router.goto("/");
```

### Route Parameters

Routes can include parameters, denoted by a colon prefix (`:`). These parameters are passed to your route handler:

```ts
router.page("/product/:id", async function* (params) {
  return <product-detail productid={params.id} />;
});
```

### Navigation

Use the `goto` method to programmatically navigate to different routes:

```ts
router.goto("/user/123");
```

You can also use regular anchor tags with `onclick` handlers:

```ts
<a href="#" onclick={() => router.goto("/user/123")}>
  View Profile
</a>
```

## License

MIT
