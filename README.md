# Bloom - Routing for WebJSX

```bash
npm install bloom
```

## Usage

```ts
import * as webjsx from "webjsx";
import { Bloom } from "bloom"; // Adjust the path based on your setup

// Instantiate Bloom by passing an element ID or an actual HTMLElement
const bloom = new Bloom("app"); // Using element ID
// Or
const appElement = document.getElementById("app")!;
const bloom = new Bloom(appElement); // Using HTMLElement

// HOME PAGE
bloom.page("/home", async function* homePage() {
  let showWarn = false;

  function validate() {
    const city = (document.querySelector('#city-box') as HTMLInputElement).value;
    if (!city) {
      showWarn = true;
      bloom.render(); // Trigger re-render
    } else {
      bloom.goto(`/city?location=${city}`); // Navigate to city page
    }
  }

  while (true) {
    yield (
      <p>
        <label>City</label>
        <input id="city-box" type="text" />
        {showWarn && <span>You must enter a city</span>}
        <button onclick={validate}>Get Weather</button>
      </p>
    );
  }
});

// CITIES PAGE 
bloom.page("/city", async function* cityPage() {
  let weather = "loading...";
  const params = new URLSearchParams(window.location.search);
  const location = params.get("location");

  if (location) {
    weatherAPI.get(location).then((result) => {
      weather = result;
      bloom.render(); // Trigger re-render
    });
  }

  function exitClick() {
    bloom.goto("/goodbye"); // Navigate to goodbye page
  }

  while (true) {
    yield (
      <div>
        <p>Weather is {weather}</p>
        <button onclick={exitClick}>Exit</button>
      </div>
    );
  }
});

// Start the App
bloom.goto("/home"); // Navigate to the home page

## Running Tests

```bash
npm run test
```

## License

MIT