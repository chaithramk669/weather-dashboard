
const searchForm = document.getElementById("search-form");
const cityInput = document.getElementById("city-input");
const searchButton = document.getElementById("search-btn");
const statusMessage = document.getElementById("status");
const weatherContent = document.getElementById("weather-content");
const welcome = document.getElementById("welcome");

// Open-Meteo API endpoints
const GEOCODING_API =
    "https://geocoding-api.open-meteo.com/v1/search";

const WEATHER_API =
    "https://api.open-meteo.com/v1/forecast";

// WMO weather codes and their descriptions.
function getWeatherInfo(code) {
    const weatherCodes = {
        0: ["Clear sky", "☀️"],
        1: ["Mainly clear", "🌤️"],
        2: ["Partly cloudy", "⛅"],
        3: ["Overcast", "☁️"],
        45: ["Foggy", "🌫️"],
        48: ["Depositing rime fog", "🌫️"],
        51: ["Light drizzle", "🌦️"],
        53: ["Moderate drizzle", "🌦️"],
        55: ["Dense drizzle", "🌧️"],
        56: ["Light freezing drizzle", "🌧️"],
        57: ["Dense freezing drizzle", "🌧️"],
        61: ["Slight rain", "🌦️"],
        63: ["Moderate rain", "🌧️"],
        65: ["Heavy rain", "🌧️"],
        66: ["Light freezing rain", "🌧️"],
        67: ["Heavy freezing rain", "🌧️"],
        71: ["Slight snowfall", "🌨️"],
        73: ["Moderate snowfall", "🌨️"],
        75: ["Heavy snowfall", "❄️"],
        77: ["Snow grains", "❄️"],
        80: ["Slight rain showers", "🌦️"],
        81: ["Moderate rain showers", "🌧️"],
        82: ["Violent rain showers", "⛈️"],
        85: ["Slight snow showers", "🌨️"],
        86: ["Heavy snow showers", "❄️"],
        95: ["Thunderstorm", "⛈️"],
        96: ["Thunderstorm with slight hail", "⛈️"],
        99: ["Thunderstorm with heavy hail", "⛈️"]
    };

    return weatherCodes[code] || ["Unknown conditions", "🌡️"];
}

// Display a readable date and time.
function formatDateTime(dateTime) {
    if (!dateTime) return "Time unavailable";

    const date = new Date(dateTime);

    if (Number.isNaN(date.getTime())) {
        return dateTime;
    }

    return new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeStyle: "short"
    }).format(date);
}

// Fetch JSON and handle HTTP errors.
async function fetchJSON(url) {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            `Request failed with status ${response.status}`
        );
    }

    return response.json();
}

// Fetch a city's coordinates using geocoding.
async function getCityCoordinates(city) {
    const params = new URLSearchParams({
        name: city,
        count: "1",
        language: "en",
        format: "json"
    });

    const data = await fetchJSON(
        `${GEOCODING_API}?${params.toString()}`
    );

    if (!data.results || data.results.length === 0) {
        throw new Error(
            "City not found. Check the spelling and try again."
        );
    }

    return data.results[0];
}

// Fetch current weather using latitude and longitude.
async function getWeather(latitude, longitude) {
    const params = new URLSearchParams({
        latitude: String(latitude),
        longitude: String(longitude),
        current: [
            "temperature_2m",
            "relative_humidity_2m",
            "apparent_temperature",
            "is_day",
            "precipitation",
            "weather_code",
            "wind_speed_10m"
        ].join(","),
        timezone: "auto",
        temperature_unit: "celsius",
        wind_speed_unit: "kmh"
    });

    const data = await fetchJSON(
        `${WEATHER_API}?${params.toString()}`
    );

    if (!data.current) {
        throw new Error("Current weather data is unavailable.");
    }

    return data;
}

// Render the received JSON data in the dashboard.
function renderWeather(location, data) {
    const current = data.current;
    const info = getWeatherInfo(current.weather_code);

    document.getElementById("city-name").textContent =
        location.name;

    const region = [location.admin1, location.country]
        .filter(Boolean)
        .filter((value, index, array) =>
            array.indexOf(value) === index
        )
        .join(", ");

    document.getElementById("country-name").textContent =
        region || "Location found";

    document.getElementById("local-time").textContent =
        `Local time: ${formatDateTime(current.time)}`;

    document.getElementById("weather-icon").textContent =
        info[1];

    document.getElementById("temperature").textContent =
        `${Math.round(current.temperature_2m)}°C`;

    document.getElementById("weather-description").textContent =
        info[0];

    document.getElementById("feels-like").textContent =
        `Feels like ${Math.round(current.apparent_temperature)}°C`;

    document.getElementById("humidity").textContent =
        `${current.relative_humidity_2m}%`;

    document.getElementById("wind-speed").textContent =
        `${current.wind_speed_10m} km/h`;

    document.getElementById("precipitation").textContent =
        `${current.precipitation} mm`;

    document.getElementById("weather-code").textContent =
        current.weather_code;

    document.getElementById("updated-time").textContent =
        `Weather observation time: ${formatDateTime(current.time)}`;

    weatherContent.hidden = false;
    welcome.hidden = true;
}

// Search and load weather asynchronously.
async function searchWeather(city) {
    searchButton.disabled = true;
    searchButton.textContent = "Loading...";
    statusMessage.classList.remove("error");
    statusMessage.textContent = "Fetching weather data...";

    try {
        const location = await getCityCoordinates(city);

        const weather = await getWeather(
            location.latitude,
            location.longitude
        );

        renderWeather(location, weather);
        statusMessage.textContent =
            `Weather loaded for ${location.name}.`;
    } catch (error) {
        console.error("Weather request failed:", error);

        statusMessage.classList.add("error");
        statusMessage.textContent =
            error instanceof TypeError
                ? "Network error. Check your internet connection and try again."
                : error.message || "Unable to retrieve weather data.";
    } finally {
        searchButton.disabled = false;
        searchButton.textContent = "Search";
    }
}

// Handle the search form.
searchForm.addEventListener("submit", event => {
    event.preventDefault();

    const city = cityInput.value.trim();

    if (!city) {
        statusMessage.classList.add("error");
        statusMessage.textContent = "Please enter a city name.";
        return;
    }

    searchWeather(city);
});

// Load an initial city's weather when the page opens.
searchWeather("Mumbai");
