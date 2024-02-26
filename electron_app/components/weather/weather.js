const weatherNowEl = document.getElementById("weather-now");
const weatherHourlyEl = document.getElementById("weather-hourly");
const weatherDailyEl = document.getElementById("weather-daily");
const axios = require("axios");

const SERVER_URL = "http://localhost:3001";

function formatHour(timestamp) {
  const date = new Date(timestamp * 1000);
  const hours = date.getHours();
  const period = hours >= 12 ? "PM" : "AM";
  const hours12 = hours % 12 || 12;
  return `${hours12}${period}`;
}

function formatDate(timestamp) {
  const date = new Date(timestamp * 1000);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function celsiusToFahrenheit(celsius) {
  return (celsius * 9) / 5 + 32;
}

function createForm() {
  const form = document.createElement("form");
  form.id = "weather-api-form";

  const apiKeyInput = document.createElement("input");
  apiKeyInput.type = "text";
  apiKeyInput.id = "weather-api-key-input";
  apiKeyInput.placeholder = "Enter api.openweathermap.org API Key";
  apiKeyInput.required = true;

  const ipAddressInput = document.createElement("input");
  ipAddressInput.type = "text";
  ipAddressInput.id = "ip-address-input";
  ipAddressInput.placeholder =
    "Public IP Address for area you want weather data.";
  ipAddressInput.required = true;

  const submitButton = document.createElement("button");
  submitButton.type = "submit";
  submitButton.textContent = "Submit";
  submitButton.className = "submit-button";

  form.appendChild(apiKeyInput);
  form.appendChild(ipAddressInput);
  form.appendChild(submitButton);

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const apiKey = apiKeyInput.value;
    const ipAddress = ipAddressInput.value;

    localStorage.setItem("weatherApiKey", apiKey);
    localStorage.setItem("ipAddress", ipAddress);

    updateWeather();
  });

  return form;
}

async function updateWeather() {
  const apiKey = localStorage.getItem("weatherApiKey");
  const ipAddress = localStorage.getItem("ipAddress");

  if (!apiKey || !ipAddress) {
    if (!document.getElementById("weather-api-form")) {
      const form = createForm();
      weatherHourlyEl.appendChild(form);
    }
  } else {
    const weatherData = await axios.get(
      `${SERVER_URL}/weather?apiKey=${apiKey}&ipAddress=${ipAddress}`
    );

    const currentWeather = `${celsiusToFahrenheit(
      weatherData.data.current.temp
    ).toFixed(1)} ${weatherData.data.current.weather[0].main}`;
    const hourlyTimesAndTemps = weatherData.data.hourly
      .slice(0, 8)
      .map(
        (hour) =>
          `<span class="weather-point"><span class="white-label">${formatHour(
            hour.dt
          )}</span> ${celsiusToFahrenheit(hour.temp).toFixed(1)}</span>`
      )
      .join(" ");

    const hourlyConditions = weatherData.data.hourly
      .slice(0, 8)
      .map(
        (hour) =>
          `<span class="weather-point hcondition">${hour.weather[0].main}</span>`
      )
      .join(" ");

    const dailyTimesAndTemps = weatherData.data.daily
      .slice(0, 8)
      .map(
        (day) =>
          `<span class="weather-point"><span class="white-label">${formatDate(
            day.dt
          )}</span> ${celsiusToFahrenheit(day.temp.max).toFixed(1)}</span>`
      )
      .join(" ");

    const dailyConditions = weatherData.data.daily
      .slice(0, 8)
      .map(
        (day) =>
          `<span class="weather-point dcondition">${day.weather[0].main}</span>`
      )
      .join(" ");
    weatherNowEl.innerHTML = currentWeather;
    weatherHourlyEl.innerHTML = `<div>${hourlyTimesAndTemps}</div><div>${hourlyConditions}</div>`;
    weatherDailyEl.innerHTML = `<div>${dailyTimesAndTemps}</div><div>${dailyConditions}</div>`;
  }
}
updateWeather();
setInterval(updateWeather, 400000);

module.exports = {
  updateWeather: updateWeather,
};
