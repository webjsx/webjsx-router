# Bloom: An Experimental UI Framework

Bloom enables you to build efficient, lightweight web applications using Web Components and Asynchronous Generators, powered by `bloom-router` and `webjsx`.

## Core Concepts

Bloom simplifies web application development by leveraging JavaScript’s native features to manage UI rendering. Components are defined as asynchronous generator functions, and routing is handled declaratively with `bloom-router`.

### Key Features

1. **Web Components**: Components are fully compliant with the Web Components standard, ensuring compatibility across modern browsers.
2. **Asynchronous Generators**: Each component is an asynchronous generator, yielding dynamic views and updating seamlessly with state changes.
3. **Declarative Routing**: Define routes and associate them with components using the `bloom-router` API.

### Example Workflow

- **Generator Workflow**: Components yield a view, wait for events (e.g., user interaction, data updates), and then yield updated views.
- **Routing**: Pages and navigation are managed with `bloom-router`, ensuring smooth transitions.

## Installation

To use Bloom in your project:

```bash
yarn add bloom-router webjsx
```

## Component API

### Declaring Components

Use the `component` function to define reusable UI elements:

```ts
import { component } from "bloom-router";

component("example-component", async function* (component) {
  let count = 0;

  while (true) {
    yield (
      <div>
        <p>Count: {count}</p>
        <button
          onclick={() => {
            count++;
            component.render();
          }}
        >
          Increment
        </button>
      </div>
    );
  }
});
```

## Building an HN Clone

Let’s build a Hacker News (HN) clone with Bloom. The app will include stories, comments, and user profiles.

### Types and Utilities

Define common types and data-fetching utilities:

```ts
type Story = {
  id: number;
  title: string;
  url?: string;
  score: number;
  by: string;
  descendants?: number;
  kids?: number[];
};

type CommentData = {
  id: number;
  by: string;
  text: string;
  kids?: number[];
};

type UserData = {
  id: string;
  created: number;
  karma: number;
  about?: string;
  submitted?: number[];
};

async function fetchTopStories(limit = 20): Promise<Story[]> {
  const topIds = await fetch(
    "https://hacker-news.firebaseio.com/v0/topstories.json"
  ).then((res) => res.json());
  const sliced = topIds.slice(0, limit);
  return Promise.all(
    sliced.map((id) =>
      fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(
        (res) => res.json()
      )
    )
  );
}

async function fetchItem<T>(id: number): Promise<T> {
  return fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(
    (res) => res.json()
  );
}

async function fetchUser(username: string): Promise<UserData> {
  return fetch(
    `https://hacker-news.firebaseio.com/v0/user/${username}.json`
  ).then((res) => res.json());
}
```

### Components

#### Story List

The **Story List** component is responsible for fetching and displaying a list of top stories from Hacker News. Each story includes its title, score, author, and a link to view the details. The component refreshes the data periodically to ensure the list stays up-to-date.

```ts
component(
  "story-list",
  async function* (component) {
    let stories = await fetchTopStories();

    while (true) {
      yield (
        <div>
          {stories.map((story) => (
            <div>
              <a href="#" onclick={() => bloom.goto(`/story/${story.id}`)}>
                {story.title}
              </a>
              <p>
                {story.score} points by <user-link username={story.by} />
              </p>
            </div>
          ))}
        </div>
      );
    }
  },
  {}
);
```

#### Comment Item

The **Comment Item** component represents a single comment in the comment thread. It fetches the comment data by its ID and displays the author and text of the comment. If the comment has replies (nested comments), they are displayed recursively using the same component.

```ts
component(
  "comment-item",
  async function* (component) {
    let commentData = await fetchItem<CommentData>(component.commentid);

    while (true) {
      yield (
        <div>
          <p>{commentData.by}</p>
          <p>{commentData.text}</p>
          {commentData.kids &&
            commentData.kids.map((kid) => <comment-item commentid={kid} />)}
        </div>
      );
    }
  },
  { commentid: 0 }
);
```

#### User Profile

The **User Profile** component displays information about a specific user, including their karma, account creation date, and a list of their recent submissions. It fetches the user data by username and updates dynamically.

```ts
component(
  "user-profile",
  async function* (component) {
    const userData = await fetchUser(component.username);

    while (true) {
      yield (
        <div>
          <h1>{userData.id}</h1>
          <p>Karma: {userData.karma}</p>
          <p>About: {userData.about}</p>
        </div>
      );
    }
  },
  { username: "" }
);
```

### Routing

Define routes for your application:

```ts
const bloom = new Bloom("app");

bloom.page("/", async function* () {
  while (true) {
    yield <story-list />;
  }
});

bloom.page("/story/:id", async function* (params) {
  yield <story-detail storyid={parseInt(params.id, 10)} />;
});

bloom.page("/user/:id", async function* (params) {
  yield <user-profile username={params.id} />;
});

bloom.goto("/");
```

## License

MIT
