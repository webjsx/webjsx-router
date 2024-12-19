# Bloom: Web Component Framework

A lightweight component framework that uses JavaScript generators to build web applications.

## Building a Hacker News Clone

We'll build a clone of Hacker News (HN) - a popular tech news aggregation site. It'll demonstrate lists, nested comments, and real-time updates.

## Installation

```bash
npm install bloom-router
```

## Core Pattern

In Bloom, components follow this pattern:

1. Generator yields current view
2. Waits for next render request
3. Repeat

The render loop looks like this:

```ts
app.component("counter", async function* (component) {
  let count = 0;

  while (true) {
    yield (
      <div>
        Count: {count}
        <button
          onclick={() => {
            count++;
            component.render(); // Request next render
          }}
        >
          Add
        </button>
      </div>
    );
  }
});
```

When `component.render()` is called, the generator continues and yields the next view with updated data.

## Building the HN Clone

Let's build our app piece by piece. First, we'll need some types and utilities:

```ts
type Story = {
  id: number;
  title: string;
  url?: string;
  score: number;
  by: string;
  descendants: number;
};

async function fetchStories(): Promise<Story[]> {
  const ids = await fetch(
    "https://hacker-news.firebaseio.com/v0/topstories.json"
  ).then((r) => r.json());
  return Promise.all(
    ids
      .slice(0, 30)
      .map((id) =>
        fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(
          (r) => r.json()
        )
      )
  );
}
```

### Story List Component

The home page shows a list of top stories. Here's how we build it:

```ts
app.component("story-list", async function* (component) {
  let stories: Story[] = [];

  // Data fetching happens outside the render loop
  const fetchData = async () => {
    stories = await fetchStories();
    component.render();
  };

  fetchData();
  setInterval(fetchData, 60000); // Refresh every minute

  while (true) {
    yield (
      <div class="stories">
        {stories.map((story) => (
          <div class="story">
            <a href={story.url} target="_blank">
              {story.title}
            </a>
            <div class="meta">
              {story.score} points by {story.by} |
              <a href="#" onclick={() => bloom.goto(`/story/${story.id}`)}>
                {story.descendants} comments
              </a>
            </div>
          </div>
        ))}
      </div>
    );
  }
});
```

### Comment Component

Comments in HN are nested - each comment can have child comments. We'll use recursion:

```ts
type Comment = {
  id: number;
  by: string;
  text: string;
  kids?: number[];
};

app.component(
  "comment-item",
  async function* (component: { commentId: number }) {
    let comment: Comment | null = null;

    const fetchComment = async () => {
      comment = await fetch(
        `https://hacker-news.firebaseio.com/v0/item/${component.commentId}.json`
      ).then((r) => r.json());
      component.render();
    };

    fetchComment();

    while (true) {
      if (!comment) {
        yield <div>Loading...</div>;
      } else {
        yield (
          <div class="comment">
            <div class="meta">{comment.by}</div>
            <div class="text" innerHTML={comment.text}></div>
            <div class="replies">
              {comment.kids?.map((id) => (
                <comment-item commentId={id} />
              ))}
            </div>
          </div>
        );
      }
    }
  }
);
```

### Story Detail Component

When users click a story's comments, we show the story detail page:

```ts
app.component("story-detail", async function* (component: { storyId: number }) {
  let story: Story | null = null;

  const fetchStory = async () => {
    story = await fetch(
      `https://hacker-news.firebaseio.com/v0/item/${component.storyId}.json`
    ).then((r) => r.json());
    component.render();
  };

  fetchStory();

  while (true) {
    if (!story) {
      yield <div>Loading story...</div>;
    } else {
      yield (
        <div class="story-detail">
          <h1>
            <a href={story.url}>{story.title}</a>
          </h1>
          <div class="meta">
            {story.score} points by {story.by}
          </div>
          <div class="comments">
            {story.kids?.map((id) => (
              <comment-item commentId={id} />
            ))}
          </div>
        </div>
      );
    }
  }
});
```

### Routing

Finally, let's wire everything up with routes:

```ts
// Home page
app.page("/", async function* () {
  while (true) {
    yield <story-list />;
  }
});

// Story detail page
app.page("/story/:id", async function* (params) {
  while (true) {
    yield <story-detail storyId={parseInt(params.id, 10)} />;
  }
});

// Start the app
bloom.goto("/");
```

No complex state management, no effect hooks, no dependency arrays - just simple JavaScript generators handling the flow of data to views.

## License

MIT
