# Bloom: An Experimental UI Framework

Bloom enables you to build efficient, lightweight web applications using Web Components and Asynchronous Generators, powered by `bloom-router` and `webjsx`.

## Core Concepts

Bloom simplifies web application development by leveraging JavaScript’s native features to manage UI rendering. Components are defined as asynchronous generator functions, and routing is handled declaratively with `bloom-router`.

### Key Features

1. **Web Components**: Components are generated as Web Components, which you can re-use anywhere on the page natively or from any framework.
2. **Asynchronous Generators**: Each component is an asynchronous generator, yielding dynamic views and updating seamlessly with state changes.
3. **Declarative Routing**: Define routes and associate them with components using the `bloom-router` API.

### Example Workflow

- **Generator Workflow**: Components yield a view, wait for events (e.g., user interaction, data updates), and then yield updated views.
- **Routing**: Pages and navigation are managed with `bloom-router`, ensuring smooth transitions.

## Installation

To use Bloom in your project:

```bash
npm install bloom-router webjsx
```

### TypeScript

Ensure your `tsconfig.json` is set up to handle JSX.

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "webjsx"
  }
}
```

Advanced instructions can be found on [WebJSX](https://webjsx.org).

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

Let's build a Hacker News (HN) clone using Bloom. This example demonstrates how to create a full-featured web application with components, routing, data fetching, and state management.

### Story List - The Home Page

The home page displays a curated list of top stories from Hacker News. When the component mounts, it fetches the IDs of top stories from the HN API, then retrieves detailed data for the top 20 stories. Each story is displayed with its title, score, author link, and comment count. The component handles loading states and provides clear feedback to users while data is being fetched.

```ts
component(
  "story-list",
  async function* (component: HTMLElement & BloomComponent) {
    let stories: Story[] | null = null;

    const fetchTopStories = async (limit = 20): Promise<Story[]> => {
      const topIds = await fetch(
        "https://hacker-news.firebaseio.com/v0/topstories.json"
      ).then((res) => res.json());
      const sliced = topIds.slice(0, limit);
      const stories = await Promise.all(
        sliced.map((id: number) =>
          fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(
            (r) => r.json()
          )
        )
      );
      return stories as Story[];
    };

    stories = await fetchTopStories();

    while (true) {
      if (!stories) {
        yield <div>Loading top stories...</div>;
      } else {
        yield (
          <div>
            {stories.map((story: Story) => (
              <div class="story-list-item">
                <a href="#" onclick={() => bloom.goto(`/story/${story.id}`)}>
                  {story.title}
                </a>
                <div class="meta">
                  {story.score} points by <user-link username={story.by} /> |{" "}
                  {story.descendants || 0} comments
                </div>
              </div>
            ))}
          </div>
        );
      }
    }
  }
);
```

### Story Detail Page

When a user clicks on a story title, they're taken to the story detail page. This component fetches and displays comprehensive information about a single story, including its title (linked to the original URL), score, author, and the full comment thread. It provides a back navigation link and gracefully handles cases where the story might not be found.

```ts
component(
  "story-detail",
  async function* (
    component: HTMLElement & BloomComponent & { storyid: number }
  ) {
    let story: Story | null = null;

    const fetchData = async (): Promise<Story | null> => {
      try {
        const result = await fetchItem<Story>(component.storyid);
        return result;
      } catch {
        return null;
      }
    };

    story = await fetchData();

    while (true) {
      if (!story?.id) {
        yield (
          <div>
            <a class="back-link" href="#" onclick={() => bloom.goto("/")}>
              Back
            </a>
            <div>Story not found.</div>
          </div>
        );
      } else {
        yield (
          <div>
            <a class="back-link" href="#" onclick={() => bloom.goto("/")}>
              &larr; Back
            </a>
            <h2>
              <a href={story.url} target="_blank" rel="noopener noreferrer">
                {story.title}
              </a>
            </h2>
            <div class="meta">
              {story.score} points by <user-link username={story.by} /> |{" "}
              {story.descendants || 0} comments
            </div>
            <hr />
            <comment-thread parentid={story.id} />
          </div>
        );
      }
    }
  },
  { storyid: 0 }
);
```

### Comment System

The comment system consists of two main components that work together to display threaded discussions:

### Comment Thread Component

This component manages the top-level structure of a story's comment thread. It fetches the list of comments for a given story and renders them as a cohesive discussion thread. If there are no comments, it displays an appropriate message.

```ts
component(
  "comment-thread",
  async function* (
    component: HTMLElement & BloomComponent & { parentid: number }
  ) {
    let parentData: CommentData | null = null;

    const fetchData = async (): Promise<CommentData | null> => {
      try {
        const result = await fetchItem<CommentData>(component.parentid);
        return result;
      } catch {
        return null;
      }
    };

    parentData = await fetchData();

    while (true) {
      if (!parentData?.kids?.length) {
        yield <div>No comments yet.</div>;
      } else {
        yield (
          <div class="comments-container">
            {parentData.kids.map((kidId: number) => (
              <comment-item commentid={kidId} />
            ))}
          </div>
        );
      }
    }
  },
  { parentid: 0 }
);
```

### Comment Item Component

This component handles the display of individual comments, including any nested replies. It supports HTML content in comment text and implements proper indentation for nested comments. The component gracefully handles deleted comments and missing content.

```ts
component(
  "comment-item",
  async function* (
    component: HTMLElement & BloomComponent & { commentid: number }
  ) {
    let commentData: CommentData | null = null;

    const fetchData = async (): Promise<CommentData | null> => {
      try {
        const result = await fetchItem<CommentData>(component.commentid);
        return result;
      } catch {
        return null;
      }
    };

    commentData = await fetchData();

    while (true) {
      if (!commentData?.id) {
        yield <div class="comment">(deleted)</div>;
      } else {
        return (
          <div class="comment">
            <div class="comment-meta">
              {commentData.by ? (
                <user-link username={commentData.by} />
              ) : (
                "(deleted)"
              )}
            </div>
            <div
              class="comment-text"
              {...{ innerHTML: commentData.text || "(no text)" }}
            ></div>
            {commentData.kids && commentData.kids.length > 0 && (
              <div class="nested-comments" style="margin-left: 20px;">
                {commentData.kids.map((kidId: number) => (
                  <comment-item commentid={kidId} />
                ))}
              </div>
            )}
          </div>
        );
      }
    }
  },
  { commentid: 0 }
);
```

### User Profile Page

The user profile page provides detailed information about a user's presence on the platform. It displays the user's karma score, account creation date, about section (if available), and a list of their recent submissions. The component implements type guards to ensure data integrity and handles missing or invalid user data appropriately.

```ts
component(
  "user-profile",
  async function* (
    component: HTMLElement & BloomComponent & { username: string }
  ) {
    let userData: UserData | null = null;
    let userStories: Story[] = [];

    const fetchUser = async (username: string): Promise<UserData> => {
      return fetch(
        `https://hacker-news.firebaseio.com/v0/user/${username}.json`
      ).then((r) => r.json());
    };

    const fetchData = async (): Promise<[UserData | null, Story[]]> => {
      try {
        const user = await fetchUser(component.username);
        const submissions = user.submitted || [];
        const stories = await Promise.all(
          submissions.slice(0, 10).map((id) => fetchItem<Story>(id))
        );
        return [
          user,
          stories.filter(
            (s): s is Story =>
              typeof s?.id === "number" &&
              typeof s?.title === "string" &&
              typeof s?.score === "number" &&
              typeof s?.by === "string"
          ),
        ];
      } catch {
        return [null, []];
      }
    };

    [userData, userStories] = await fetchData();

    while (true) {
      if (!userData) {
        yield (
          <div>
            <a class="back-link" href="#" onclick={() => bloom.goto("/")}>
              Back
            </a>
            <div>User not found.</div>
          </div>
        );
      } else {
        return (
          <div>
            <a class="back-link" href="#" onclick={() => bloom.goto("/")}>
              &larr; Back
            </a>
            <h2>User: {userData.id}</h2>
            <div class="user-info">
              <p>Karma: {userData.karma}</p>
              <p>
                Created:{" "}
                {new Date(userData.created * 1000).toLocaleDateString()}
              </p>
              {userData.about && (
                <div class="about">
                  <h3>About</h3>
                  <div {...{ innerHTML: userData.about }}></div>
                </div>
              )}
            </div>
            <div class="user-submissions">
              <h3>Recent Submissions</h3>
              {userStories.map((story) => (
                <div class="story-list-item">
                  <a href="#" onclick={() => bloom.goto(`/story/${story.id}`)}>
                    {story.title}
                  </a>
                  <div class="meta">
                    {story.score} points | {story.descendants || 0} comments
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }
    }
  },
  { username: "" }
);
```

### User Link Component

A utility component used throughout the application to create consistent user profile links. It takes a username prop and renders a clickable link that navigates to that user's profile page.

```ts
component(
  "user-link",
  async function* (
    component: HTMLElement & BloomComponent & { username: string }
  ) {
    while (true) {
      yield (
        <a href="#" onclick={() => bloom.goto(`/user/${component.username}`)}>
          {component.username}
        </a>
      );
    }
  },
  { username: "" }
);
```

###Application Types

The application uses TypeScript interfaces to ensure type safety across components:

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
```

### Routing Setup

Finally, we configure the routes for our application:

```ts
const bloom = new Bloom("app");

bloom.page("/", async function* () {
  while (true) {
    yield <story-list />;
  }
});

bloom.page("/story/:id", async function* (params) {
  const storyId = parseInt(params.id, 10);
  while (true) {
    yield <story-detail storyid={storyId} />;
  }
});

bloom.page("/user/:id", async function* (params) {
  while (true) {
    yield <user-profile username={params.id} />;
  }
});

bloom.goto("/");
```

This example demonstrates how Bloom components work together to create a full-featured web application, handling data fetching, state management, routing, and complex UI interactions.

## License

MIT
