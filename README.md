# Bloom: A Web Component Framework

Build lightweight, efficient web applications using Async Generators and Web Components.

## Core Pattern

The core design of Bloom revolves around a simplified component lifecycle, leveraging JavaScript generators to manage UI rendering. Here's how it works:

1. **Generator Initiation**: Each component is defined as an asynchronous generator function and is exposed as a Web Component.
2. **Yield Current View**: On each iteration, the generator yields the current view, which is a representation of the UI at that point in time.
3. **Wait for Trigger**: After yielding the view, the generator pauses, waiting for a trigger to render the next view. This trigger typically comes from user interactions or other events (such as data refreshing) that necessitate a UI update.
4. **Render Update**: Upon receiving a trigger, such as a call to `component.render()`, the generator resumes operation, potentially with updated state leading to a new UI representation.
5. **Repeat**: This process repeats each time the component needs to update the UI.

The following snippet illustrates a simple counter component using Bloom's core pattern:

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
            component.render(); // Trigger next render
          }}
        >
          Add
        </button>
      </div>
    );
  }
});
```

In this example, the component renders a count and a button. Clicking the button increases the count and explicitly requests the next render, causing the generator to yield a new view with the updated count.

When `component.render()` is called, the generator continues and yields the next view with updated data.

## Building an HN Clone

The best way to learn is by doing. Let's build a clone of Hacker News (HN) - a popular tech news aggregation site. It'll demonstrate lists, nested comments, and real-time updates.
If you want to jump right into code, you can [edit this app on StackBlitz](https://stackblitz.com/edit/bloom-hn)


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
