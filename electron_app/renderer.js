const todoForm = document.getElementById("todo-form");
const todoInput = document.getElementById("todo-input");
const todoList = document.getElementById("todo-list");
const clockUpdater = require("./components/clock/clock");
const weatherUpdater = require("./components/weather/weather");
const alarmController = require("./components/alarm/alarm");
const cryptoController = require("./components/crypto/crypto");
const todo = require("./components/todo/todo");
const tradingstats = require("./components/tradingstats/tradingstats");
const runScheduler = require("./components/scheduler/scheduler");

const { ipcRenderer } = require("electron");

const SERVER_URL = "http://localhost:3001";

//Init trading stats
tradingstats();

//Render balances from mexc
async function fetchBalances(apiKey, apiSecret) {
  try {
    const response = await axios.get(
      `${SERVER_URL}/balances?apiKey=${apiKey}&apiSecret=${apiSecret}`
    );
    console.log(response);
    return response;
  } catch (error) {
    console.error("Error fetching balances:", error);
  }
}

//Fetch prices of cryptos
async function fetchCryptoPrices() {
  try {
    const response = await axios.get(`${SERVER_URL}/crypto`);
    console.log(response);
    return response.data;
  } catch (error) {
    console.error("Error fetching crypto prices:", error);
  }
}

//MEXC API Form
function createForm() {
  const form = document.createElement("form");
  form.id = "balances-api-form";
  const apiKeyInput = document.createElement("input");
  apiKeyInput.type = "text";
  apiKeyInput.id = "mexc-api-key-input";
  apiKeyInput.placeholder = "MEXC API Key";
  apiKeyInput.required = true;
  const apiSecretInput = document.createElement("input");
  apiSecretInput.type = "text";
  apiSecretInput.id = "mexc-api-secret-input";
  apiSecretInput.placeholder = "MEXC API Secret";
  apiSecretInput.required = true;
  const submitButton = document.createElement("button");
  submitButton.type = "submit";
  submitButton.textContent = "Submit";
  submitButton.className = "submit-button";
  form.appendChild(apiKeyInput);
  form.appendChild(apiSecretInput);
  form.appendChild(submitButton);
  return form;
}

const balancesEL = document.getElementById("bingXBots-container");
balancesEL.addEventListener("submit", async (event) => {
  if (event.target.id === "balances-api-form") {
    event.preventDefault();
    const apiKey = document.getElementById("mexc-api-key-input").value;
    const apiSecret = document.getElementById("mexc-api-secret-input").value;
    localStorage.setItem("mexcApiKey", apiKey);
    localStorage.setItem("mexcApiSecret", apiSecret);
    balancesEL.innerHTML = "";
    renderBalances();
  }
});

async function renderBalances() {
  const apiKey = localStorage.getItem("mexcApiKey");
  const apiSecret = localStorage.getItem("mexcApiSecret");
  const body = document.querySelector("#bingXBots-container");

  if (!apiKey || !apiSecret) {
    if (!document.getElementById("balances-api-form")) {
      const form = createForm();
      body.appendChild(form);
    }
  } else {
    const balancesResponse = await fetchBalances(apiKey, apiSecret);
    const cryptoResponse = await fetchCryptoPrices();

    console.log(cryptoResponse);
    const balancesData = balancesResponse.data;
    const cryptoData = cryptoResponse.mexc;

    const newDiv = document.createElement("div");

    let totalBalanceInUSD = 0;
    let balanceTexts = [];

    if (balancesData) {
      balancesData.forEach((balance) => {
        if (parseFloat(balance.free) > 0) {
          let valueInUSD;
          if (balance.asset === "USDC") {
            valueInUSD = parseFloat(balance.free);
          } else {
            const crypto = cryptoData.find((c) =>
              c.pair.startsWith(balance.asset)
            );
            if (crypto) {
              valueInUSD = parseFloat(balance.free) * parseFloat(crypto.price);
            }
          }
          if (valueInUSD !== undefined && valueInUSD >= 1) {
            balanceTexts.push(
              `${balance.asset} ${parseFloat(balance.free).toFixed(
                balance.asset === "USDC" ? 2 : 6
              )} $${valueInUSD.toFixed(2)}`
            );
            totalBalanceInUSD += valueInUSD;
          }
        }
      });

      const total = document.createElement("p");
      total.textContent = `Total $${totalBalanceInUSD.toFixed(2)}`;
      const spaceBefore = document.createElement("span");
      spaceBefore.textContent = " ";
      newDiv.appendChild(spaceBefore);
      newDiv.appendChild(total);
      const spaceAfter = document.createElement("span");
      spaceAfter.textContent = " ";
      newDiv.appendChild(spaceAfter);

      balanceTexts.forEach((text) => {
        const p = document.createElement("p");
        p.textContent = text;
        p.className = "balance";
        newDiv.appendChild(p);
        const spaceAfter = document.createElement("span");
        spaceAfter.textContent = " ";
        newDiv.appendChild(spaceAfter);
      });
      try {
       
        const { avgDailyProfitPercent, avgMonthlyProfitPercent, avgYearlyProfitPercent } = await tradingstats();

        const dailyProfitUSD = (totalBalanceInUSD * avgDailyProfitPercent) / 100;
        const monthlyProfitUSD =
          (totalBalanceInUSD * avgMonthlyProfitPercent) / 100;
        const yearlyProfitUSD =
          (totalBalanceInUSD * avgYearlyProfitPercent) / 100;

        const profits = document.createElement("p");
        profits.textContent = `${avgDailyProfitPercent.toFixed(
          2
        )}%/Day($${dailyProfitUSD.toFixed(2)}), ${avgMonthlyProfitPercent.toFixed(
          2
        )}%/Month($${monthlyProfitUSD.toFixed(
          2
        )}), ${avgYearlyProfitPercent.toFixed(
          2
        )}%/Year($${yearlyProfitUSD.toFixed(2)})`;
        profits.className = "profit";

        newDiv.appendChild(profits);
      } catch (error) {
        console.error("Error: ", error);
      }
    } else {
      console.error("Error: data is undefined");
    }

    body.innerHTML = "";
    body.appendChild(newDiv);
    const date = new Date().toISOString().split("T")[0];
    const balances = { date, total: totalBalanceInUSD.toFixed(2) }; 
    let history = JSON.parse(localStorage.getItem("history")) || [];
    if (!history.length || history[history.length - 1].date !== date) {
      history.push(balances);
      localStorage.setItem("history", JSON.stringify(history));
    }

    const tbody = document.querySelector("#history-table tbody");
    tbody.innerHTML = "";
    history
      .slice()
      .reverse()
      .forEach((balance) => {
        const tr = document.createElement("tr");
        const dateCell = document.createElement("td");
        const balanceCell = document.createElement("td");
        const commentCell = document.createElement("td");
        dateCell.textContent = balance.date;
        balanceCell.textContent = `$${balance.total}`;
        commentCell.textContent = balance.comment || "";
        tr.appendChild(dateCell);
        tr.appendChild(balanceCell);
        tr.appendChild(commentCell);
        tbody.appendChild(tr);
      });
  }
}

renderBalances();
setInterval(() => {
  renderBalances();
}, 10000);

//History modal
var modal = document.getElementById("modal");
var btn = document.getElementById("history-btn");
var span = document.getElementsByClassName("close")[0];
btn.onclick = function () {
  modal.style.display = "block";
  let history = JSON.parse(localStorage.getItem("history")) || [];
  history = history.reverse();

  const tbody = document.querySelector("#history-table tbody");
  tbody.innerHTML = "";
  history.forEach((balance) => {
    const tr = document.createElement("tr");
    const dateCell = document.createElement("td");
    const balanceCell = document.createElement("td");

    dateCell.textContent = balance.date;
    balanceCell.textContent = balance.total;

    tr.appendChild(dateCell);
    tr.appendChild(balanceCell);

    tbody.appendChild(tr);
  });
};

//Close History Modal
span.onclick = function () {
  modal.style.display = "none";
};

window.onclick = function (event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
};

//Add comment to today's date and balance.
function addComment() {
  const date = new Date().toISOString().split("T")[0];
  const comment = document.querySelector("#comment-input").value;
  let history = JSON.parse(localStorage.getItem("history")) || [];
  const todayBalance = history.find((balance) => balance.date === date);
  if (todayBalance) {
    todayBalance.comment = comment;
  } else {
    const newBalance = { date, total: "0.00", comment };
    history.push(newBalance);
  }
  localStorage.setItem("history", JSON.stringify(history));
}

document
  .querySelector("#comment-input")
  .addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      addComment();
      renderBalances();
    }
  });

//Init Scheduler
runScheduler();

//Init clock
clockUpdater.updateClock();
setInterval(clockUpdater.updateClock, 1000);

//Init weather
weatherUpdater.updateWeather();

//init crypto
cryptoController.startUpdatingCrypto();

//Init alarm
document.addEventListener("DOMContentLoaded", function () {
  alarmController.initAlarmController();
});

//Init todo's
todoForm.addEventListener("submit", function (event) {
  event.preventDefault();
  if (todoInput.value.trim()) {
    todo.addTodoToList(todoInput.value, todoList);
    todo.saveTodos(todoList);
    todoInput.value = "";
  }
});

todo.loadTodos(todoList, todo.addTodoToList);
