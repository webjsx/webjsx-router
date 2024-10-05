import * as webjsx from "webjsx";

// Assuming darkTheme and weatherAPI are some utilities you have in your system.
const darkTheme: any = {};
const weatherAPI: any = {};

// Instantiate Bloom
const bloom = new Bloom();

// Apply the dark theme (if applicable)
bloom.apply = (theme: any) => {
  console.log("Applying theme:", theme); // Placeholder for theme application logic
};
bloom.apply(darkTheme); // Apply the dark theme

// Define the /home page route
bloom.page("/home", async function* homePage() {
  let showWarn = false;

  function validate() {
    const city = (document.querySelector("#city-box")! as HTMLInputElement)
      .value;

    if (city === "") {
      showWarn = true;
      bloom.render(); // Trigger re-render if no city is entered
    } else {
      bloom.goto(`/city?location=${city}`); // Navigate to the city page with city as a query param
    }
  }

  // Generator loop to keep yielding the page content
  while (true) {
    yield (
      <p>
        <label>City</label>
        <input id="city-box" type="text" />
        {showWarn ? <span>You must enter a city</span> : undefined}
        <button onclick={validate}>Get Weather</button>
      </p>
    );
  }
});

// Define the /city page route with a dynamic city name
bloom.page("/city", async function* cityPage() {
  let weather = "loading..."; // Initial state for the weather

  // Fetch the location from the query parameters
  const params = new URLSearchParams(window.location.search);
  const location = params.get("location");

  if (location) {
    // Simulate an asynchronous API call to fetch the weather data
    weatherAPI.get(location).then((result: string) => {
      weather = result;
      bloom.render(); // Trigger re-render once the weather data is available
    });
  }

  function exitClick() {
    bloom.goto("/goodbye"); // Navigate to a goodbye page (if implemented)
  }

  // Generator loop to keep yielding the page content
  while (true) {
    yield (
      <div>
        <p>Weather is {weather ?? "loading..."}</p>
        <p>
          <button id="exitButton" onclick={exitClick}>
            Exit
          </button>
        </p>
      </div>
    );
  }
});

// Optionally, define other routes like /goodbye if needed
bloom.page("/goodbye", async function* goodbyePage() {
  while (true) {
    yield (
      <div>
        <h1>Goodbye!</h1>
        <p>Thank you for using the app.</p>
        <button onclick={() => bloom.goto("/home")}>Return to Home</button>
      </div>
    );
  }
});

// Start the application by navigating to the home page
bloom.goto("/home");
