const apiKey = "ec220ec4024317da819dc5d5d0e8a24b"; // Put your OpenWeatherMap API key here

const cityInput = document.getElementById("city-input");
const suggestions = document.getElementById("suggestions");
const searchBtn = document.getElementById("search-btn");
const weatherDiv = document.getElementById("weather-result");
const forecastDiv = document.getElementById("forecast-result");

let selectedCity = "";

// Fetch city suggestions from OpenWeatherMap Geocoding API
async function fetchCitySuggestions(query) {
  if (!query) return [];

  const limit = 5;
  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
    query
  )}&limit=${limit}&appid=${apiKey}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch");
    const data = await res.json();

    // Return city names with country
    return data.map(
      (item) =>
        `${item.name}${item.state ? ", " + item.state : ""}, ${item.country}`
    );
  } catch (error) {
    console.error("Error fetching city suggestions:", error);
    return [];
  }
}

// Show autocomplete suggestions dropdown
cityInput.addEventListener("input", async () => {
  const query = cityInput.value.trim();

  suggestions.innerHTML = "";

  if (query.length === 0) return;

  const cities = await fetchCitySuggestions(query);

  cities.forEach((city) => {
    const div = document.createElement("div");
    div.className = "list-group-item list-group-item-action";
    div.textContent = city;
    div.style.cursor = "pointer";

    div.addEventListener("click", () => {
      cityInput.value = city;
      suggestions.innerHTML = "";
      selectedCity = city;
    });

    suggestions.appendChild(div);
  });
});

// Close suggestions if clicked outside
document.addEventListener("click", (e) => {
  if (e.target !== cityInput && !suggestions.contains(e.target)) {
    suggestions.innerHTML = "";
  }
});

// Helper: Extract city name (without state/country) for API calls
function extractCityName(fullName) {
  return fullName.split(",")[0];
}

// Fetch current weather by city name
async function getWeather(city) {
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
        city
      )}&appid=${apiKey}&units=metric`
    );
    return await res.json();
  } catch (error) {
    console.error("Error fetching weather:", error);
  }
}

// Fetch 5-day forecast
async function getForecast(city) {
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(
        city
      )}&appid=${apiKey}&units=metric`
    );
    return await res.json();
  } catch (error) {
    console.error("Error fetching forecast:", error);
  }
}

function setBackground(condition) {
  document.body.classList.remove(
    "clear",
    "clouds",
    "rain",
    "snow",
    "thunderstorm",
    "mist"
  );

  if (condition.includes("Clear")) {
    document.body.classList.add("clear");
  } else if (condition.includes("Clouds")) {
    document.body.classList.add("clouds");
  } else if (condition.includes("Rain") || condition.includes("Drizzle")) {
    document.body.classList.add("rain");
  } else if (condition.includes("Snow")) {
    document.body.classList.add("snow");
  } else if (condition.includes("Thunderstorm")) {
    document.body.classList.add("thunderstorm");
  } else {
    document.body.classList.add("mist");
  }
}

function showForecast(forecastData) {
  forecastDiv.innerHTML = `<h3 class="text-primary mb-3">5-Day Forecast</h3>`;

  const list = forecastData.list;
  const daily = list.filter((item) => item.dt_txt.includes("12:00:00"));

  let html = `<div class="forecast-container">`;

  daily.forEach((item) => {
    html += `
      <div class="card forecast-card text-center shadow-sm">
        <div class="card-body">
          <h5 class="card-title">${new Date(item.dt_txt).toLocaleDateString()}</h5>
          <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png" alt="Icon" />
          <p class="card-text mb-1">${item.weather[0].main}</p>
          <p class="card-text fw-bold">${item.main.temp.toFixed(1)}°C</p>
        </div>
      </div>
    `;
  });

  html += `</div>`;
  forecastDiv.innerHTML += html;
}

searchBtn.addEventListener("click", async () => {
  let city = cityInput.value.trim();
  if (city === "") {
    weatherDiv.innerHTML =
      `<div class="alert alert-warning">Please enter a city name.</div>`;
    forecastDiv.innerHTML = "";
    document.body.className = "";
    return;
  }

  // If user selected suggestion before, extract only city name part
  city = extractCityName(city);

  weatherDiv.innerHTML = `<div class="text-center">Loading...</div>`;
  forecastDiv.innerHTML = "";

  const data = await getWeather(city);

  if (data.cod === "404") {
    weatherDiv.innerHTML =
      `<div class="alert alert-danger">City not found. Please try again.</div>`;
    document.body.className = "";
    forecastDiv.innerHTML = "";
    return;
  }

  if (data.cod !== 200) {
    weatherDiv.innerHTML = `<div class="alert alert-danger">Error: ${data.message}</div>`;
    document.body.className = "";
    forecastDiv.innerHTML = "";
    return;
  }

  weatherDiv.innerHTML = `
    <div class="card text-center shadow-sm">
      <div class="card-body">
        <h2 class="card-title">${data.name}, ${data.sys.country}</h2>
        <p class="card-text text-capitalize">${data.weather[0].description}</p>
        <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" alt="Weather icon" />
        <p class="card-text">Temperature: <strong>${data.main.temp}°C</strong></p>
        <p class="card-text">Humidity: <strong>${data.main.humidity}%</strong></p>
        <p class="card-text">Wind Speed: <strong>${data.wind.speed} m/s</strong></p>
      </div>
    </div>
  `;

  setBackground(data.weather[0].main);

  const forecastData = await getForecast(city);

  if (forecastData.cod !== "200") {
    forecastDiv.innerHTML = `<div class="alert alert-danger">Could not load forecast.</div>`;
  } else {
    showForecast(forecastData);
  }
});
