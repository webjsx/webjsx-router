# Bloom: Component Framework for Web Apps

Lightweight component & routing framework for building web applications. Built on native Web Components.

## Installation

```bash
npm install bloom-router
```

## Basic Usage

```typescript
import { Bloom } from "bloom-router";

// Initialize
const app = new Bloom("#app");

// Define component
app.component("counter-app", async function* (component, attributes) {
  let count = 0;
  
  const increment = () => {
    count++;
    component.render();
  };

  while (true) {
    yield (
      <div>
        <h1>Count: {count}</h1>
        <button onclick={increment}>Increment</button>
      </div>
    );
  }
});

// Use in HTML
<counter-app></counter-app>
```

## Components

### State & Events

```typescript
// Component with multiple state values
app.component("user-form", async function* (component, attributes) {
  let name = "";
  let email = "";

  const updateName = (e: Event) => {
    name = (e.target as HTMLInputElement).value;
    component.render();
  };

  const updateEmail = (e: Event) => {
    email = (e.target as HTMLInputElement).value; 
    component.render();
  };

  const submit = (e: Event) => {
    e.preventDefault();
    console.log({ name, email });
  };

  while (true) {
    yield (
      <form onsubmit={submit}>
        <input 
          type="text"
          value={name}
          oninput={updateName}
          placeholder="Name"
        />
        <input
          type="email" 
          value={email}
          oninput={updateEmail}
          placeholder="Email"
        />
        <button type="submit">Submit</button>
      </form>
    );
  }
});
```

### Attributes

```typescript
// Component that observes attributes
app.component("hello-user", async function* (component, attributes) {
  while (true) {
    yield (
      <div>
        Hello {attributes.name || "Anonymous"}!
      </div>
    );
  }
}, {
  observedAttributes: ["name"]
});

// Usage
<hello-user name="John"></hello-user>
```

### Shadow DOM

```typescript
app.component("shadow-card", async function* (component, attributes) {
  while (true) {
    yield (
      <div class="card">
        <style>
          {`
            .card {
              border: 1px solid #ccc;
              padding: 1rem;
            }
          `}
        </style>
        <slot>Default Content</slot>
      </div>
    );
  }
}, { 
  shadow: "open" // or "closed"
});

// Usage
<shadow-card>
  <h2>Card Title</h2>
  <p>Card content</p>
</shadow-card>
```

### Slots

```typescript
// Component with named slots
app.component("layout-component", async function* (component, attributes) {
  while (true) {
    yield (
      <div class="layout">
        <header>
          <slot name="header">Default Header</slot>
        </header>
        <main>
          <slot>Main Content</slot>
        </main>
        <footer>
          <slot name="footer">Default Footer</slot>
        </footer>
      </div>
    );
  }
}, { shadow: "open" });

// Usage
<layout-component>
  <h1 slot="header">My App</h1>
  <div>Main content here</div>
  <p slot="footer">Footer content</p>
</layout-component>
```

### Nested Components

```typescript
// Child component
app.component("todo-item", async function* (component, attributes) {
  const toggle = () => {
    component.setAttribute("completed", 
      attributes.completed === "true" ? "false" : "true"
    );
  };

  while (true) {
    yield (
      <li 
        class={attributes.completed === "true" ? "completed" : ""}
        onclick={toggle}
      >
        {attributes.text}
      </li>
    );
  }
}, {
  observedAttributes: ["completed", "text"]
});

// Parent component
app.component("todo-list", async function* (component, attributes) {
  const items = [
    { id: 1, text: "Learn Bloom", completed: false },
    { id: 2, text: "Build App", completed: true }
  ];

  while (true) {
    yield (
      <ul>
        {items.map(item => (
          <todo-item
            text={item.text}
            completed={item.completed.toString()}
          />
        ))}
      </ul>
    );
  }
});
```

## Routing

### Basic Routing

```typescript
const app = new Bloom("#app");

// Define routes
app.page("/", async function* () {
  yield <h1>Home</h1>;
});

app.page("/about", async function* () {
  yield <h1>About</h1>;
});

// Dynamic routes
app.page("/users/:id", async function* (params) {
  yield <h1>User {params.id}</h1>;
});

// Navigate
app.goto("/about");
```

### Route Parameters & Query Strings

```typescript
app.page("/search/:category", async function* (params, query) {
  const searchParams = new URLSearchParams(query);
  const sort = searchParams.get("sort") || "default";

  yield (
    <div>
      <h1>Search {params.category}</h1>
      <p>Sort by: {sort}</p>
    </div>
  );
});

// URL: /search/books?sort=title
```

### Route Components

```typescript
// Components can be used in routes
app.component("user-profile", async function* (component, attributes) {
  while (true) {
    yield (
      <div>
        <h2>Profile for user {attributes.id}</h2>
      </div>
    );
  }
});

app.page("/users/:id", async function* (params) {
  yield <user-profile id={params.id} />;
});
```

## Testing

### Component Testing

```typescript
import { expect } from "chai";
import { Bloom } from "bloom-router";

describe("Counter Component", () => {
  let bloom: Bloom;
  
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
    bloom = new Bloom("#app");
  });

  it("should increment counter", async () => {
    bloom.component("test-counter", async function* (component) {
      let count = 0;
      
      const increment = () => {
        count++;
        component.render();
      };

      while (true) {
        yield (
          <div>
            <span data-testid="count">{count}</span>
            <button onclick={increment}>+</button>
          </div>
        );
      }
    });

    const element = document.createElement("test-counter");
    document.body.appendChild(element);

    await new Promise(resolve => setTimeout(resolve, 0));

    const count = element.querySelector('[data-testid="count"]');
    const button = element.querySelector("button");

    expect(count!.textContent).to.equal("0");
    
    button!.click();
    await new Promise(resolve => setTimeout(resolve, 0));
    
    expect(count!.textContent).to.equal("1");
  });
});
```

### Route Testing

```typescript
describe("Router", () => {
  let bloom: Bloom;

  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
    bloom = new Bloom("#app");
  });

  it("should render route content", async () => {
    bloom.page("/test", async function* () {
      yield <div id="test-route">Test Route</div>;
    });

    await bloom.goto("/test");

    const element = document.getElementById("test-route");
    expect(element).to.exist;
    expect(element!.textContent).to.equal("Test Route");
  });

  it("should handle route params", async () => {
    bloom.page("/users/:id", async function* (params) {
      yield <div id="user-route">User {params.id}</div>;
    });

    await bloom.goto("/users/123");

    const element = document.getElementById("user-route");
    expect(element!.textContent).to.equal("User 123");
  });
});
```

## TypeScript Types

```typescript
// Component Types
type ComponentGenerator = (
  component: any,
  attributes: Record<string, string>
) => AsyncGenerator<VNode, void, void>;

interface ComponentOptions {
  shadow?: "open" | "closed";
  observedAttributes?: string[];
}

// Route Types
type PageGenerator = (
  params: Record<string, string>,
  query: string
) => AsyncGenerator<VNode, void, void>;

// Component Instance
declare class BloomComponent extends HTMLElement {
  connected: boolean;
  render(): void;
  setAttribute(name: string, value: string): void;
}

// Framework Instance
declare class Bloom {
  constructor(elementOrId: string | HTMLElement);
  
  component(
    name: string,
    generator: ComponentGenerator,
    options?: ComponentOptions
  ): void;
  
  page(
    pattern: string,
    pageGenerator: PageGenerator
  ): void;
  
  goto(path: string): Promise<void>;
  
  render(): void;
}
```

## Complete Examples

### Todo App
```typescript
interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

app.component("todo-app", async function* (component) {
  let todos: Todo[] = [];
  let newTodo = "";

  const addTodo = (e: Event) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    
    todos = [...todos, {
      id: Date.now(),
      text: newTodo,
      completed: false
    }];
    newTodo = "";
    component.render();
  };

  const toggleTodo = (id: number) => {
    todos = todos.map(todo =>
      todo.id === id 
        ? { ...todo, completed: !todo.completed }
        : todo
    );
    component.render();
  };

  const updateNewTodo = (e: Event) => {
    newTodo = (e.target as HTMLInputElement).value;
    component.render();
  };

  while (true) {
    yield (
      <div class="todo-app">
        <h1>Todo List</h1>
        
        <form onsubmit={addTodo}>
          <input
            type="text"
            value={newTodo}
            oninput={updateNewTodo}
            placeholder="What needs to be done?"
          />
          <button type="submit">Add</button>
        </form>

        <ul>
          {todos.map(todo => (
            <li
              key={todo.id}
              class={todo.completed ? "completed" : ""}
              onclick={() => toggleTodo(todo.id)}
            >
              {todo.text}
            </li>
          ))}
        </ul>

        <div class="todo-stats">
          {todos.length} items,
          {todos.filter(t => !t.completed).length} remaining
        </div>
      </div>
    );
  }
});
```

### Blog with Routing
```typescript
interface Post {
  id: number;
  title: string;
  content: string;
}

// Post List Component
app.component("post-list", async function* (component) {
  const posts: Post[] = [
    { id: 1, title: "First Post", content: "..." },
    { id: 2, title: "Second Post", content: "..." }
  ];

  while (true) {
    yield (
      <div class="posts">
        {posts.map(post => (
          <article>
            <h2>{post.title}</h2>
            <a href={`/posts/${post.id}`}>Read more</a>
          </article>
        ))}
      </div>
    );
  }
});

// Single Post Component
app.component("post-view", async function* (component, attributes) {
  const post = {
    id: parseInt(attributes.id),
    title: `Post ${attributes.id}`,
    content: "..."
  };

  while (true) {
    yield (
      <article>
        <h1>{post.title}</h1>
        <div class="content">{post.content}</div>
        <a href="/posts">Back to posts</a>
      </article>
    );
  }
}, {
  observedAttributes: ["id"]
});

// Routes
app.page("/posts", async function* () {
  yield <post-list />;
});

app.page("/posts/:id", async function* (params) {
  yield <post-view id={params.id} />;
});

// Initialize
app.goto("/posts");
```
