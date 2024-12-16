# BloomJS

BloomJS is a lightweight, modern JavaScript framework for building web applications using Web Components and JSX. It provides a simple, yet powerful way to create reactive components and handle client-side routing.

## Features

- **Web Components**: Create reusable, encapsulated components using the native Web Components API
- **JSX Support**: Write components using familiar JSX syntax
- **Reactive Updates**: Efficient DOM updates with built-in reactivity
- **Client-side Routing**: Simple and flexible routing system
- **Shadow DOM Support**: Optional shadow DOM encapsulation for components
- **TypeScript Support**: Built with TypeScript for better development experience
- **Small Bundle Size**: Minimal dependencies and small footprint
- **Async by Default**: Built-in support for async operations and generators

## Installation

```bash
npm install bloomjs
```

## Quick Start

Here's a simple example of creating a counter component:

```tsx
import { Bloom } from 'bloomjs';

const app = new Bloom('app');

// Define a counter component
app.component('counter', async function* (component, attributes) {
  let count = 0;
  
  const increment = () => {
    count++;
    component.render();
  };

  while (true) {
    yield (
      <div>
        <span>Count: {count}</span>
        <button onclick={increment}>Increment</button>
      </div>
    );
  }
});

// Use it in your HTML
// <counter></counter>
```

## Components

### Creating Components

Components are created using the `component` method:

```tsx
app.component(name, generator, options);
```

- `name`: String identifier for the component
- `generator`: Async generator function that yields JSX
- `options`: Optional configuration object

### Component Generator

The generator function receives two parameters:
- `component`: Reference to the component instance
- `attributes`: Object containing the component's attributes

```tsx
async function* generator(component, attributes) {
  while (true) {
    yield <div>Hello {attributes.name}</div>;
  }
}
```

### Component Options

```typescript
interface ComponentOptions {
  shadow?: 'open' | 'closed';  // Enable Shadow DOM
  observedAttributes?: string[];  // Attributes to watch for changes
}
```

## Routing

### Setting up Routes

```tsx
const app = new Bloom('app');

app.page('/home', async function* () {
  yield <div>Home Page</div>;
});

app.page('/user/:id', async function* (params) {
  yield <div>User {params.id}</div>;
});
```

### Navigation

```typescript
// Programmatic navigation
await app.goto('/home');

// Using regular links
<a href="/home">Home</a>
```

## Shadow DOM

Enable Shadow DOM encapsulation for components:

```tsx
app.component('encapsulated', async function* (component) {
  yield <div>Shadow DOM Content</div>;
}, { shadow: 'open' });
```

## Attributes and Properties

Components can receive attributes that update automatically:

```tsx
app.component('greeting', async function* (component, attributes) {
  while (true) {
    yield <div>Hello {attributes.name}!</div>;
  }
}, {
  observedAttributes: ['name']
});

// Usage:
<greeting name="World"></greeting>
```

## Development

### Prerequisites

- Node.js 14+
- npm or yarn

### Building

```bash
npm install
npm run build
```

### Testing

```bash
npm test
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
