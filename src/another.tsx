import * as webjsx from "webjsx";

const bloom: any = {};
const darkTheme: any = {};
const weatherAPI: any = {};

bloom.apply(darkTheme);

bloom.page("/home", async function* homePage() {
  let showWarn = false;

  function validate() {
    const city: string = (document.querySelector('#city-box')! as HTMLInputElement).value;

    if (city === "") {
      showWarn = true;
      bloom.render();
    } else {
      bloom.goto(`/cities?location=${city}`);
    }
  }

  while (true) {
    yield 
    <p>
      <label>City</label>
      <input id="city-box" type="text" />
      {
        showWarn ? <span>You must enter a city</span> : undefined
      }
      <button onClick={validate}>Get Weather</button>
    </p>;
  }
});

bloom.page("/city", async function* cityPage() {
  let weather = "";

  const params = new URLSearchParams(window.location.search);

  weatherAPI.get(params.get("location")).then((result: string) => {
    weather = result;
    bloom.render();
  });

  function exitClick() {
    bloom.goto("/goodbye");
  }

  while (true) {
    yield <div>
      <p>
        Weather is {weather ?? "loading..."}
      </p>
      <p>
        <button id="exitButton" onClick={exitClick}>Exit</button>
      </p>
    </div>;
  }
});

// Start the app.
 bloom.goto("/home");
