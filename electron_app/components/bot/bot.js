const axios = require('axios');
const kucoinBotsEl = document.getElementById('kucoinBots-container');
const { playAlarm, initAlarmController, stopAlarm } = require('../alarm/alarm');
const SERVER_URL = 'http://localhost:3001';

async function sendUsdtBalanceChange(balance) {
  try {
    await axios.post(`${SERVER_URL}/usdtBalanceChanged`, { balance });
  } catch (error) {
    console.error("Error sending USDT balance change:", error);
  }
}

async function getCryptoPrice(currency) {
  const response = await axios.get(`https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=${currency}-USDT`);

  if (response.data && response.data.data && response.data.data.price) {
    return parseFloat(response.data.data.price);
  } else {
    return 0;
  }
}

let prevUsdtBalance = 0;

async function updateKucoinBots() {
  const botsData = await axios.get(`${SERVER_URL}/kucoinBots`);

  let usdtBalance = 0;
  let nonZeroCryptoUSD = 0;
  let nonZeroBalances = {};

  for (let bot of botsData.data.nonZeroBalances) {
    if (bot.currency !== "USDT" && parseFloat(bot.balance) > 0) {
      if (!nonZeroBalances[bot.currency]) {
        nonZeroBalances[bot.currency] = { balance: 0, price: 0 };
      }
      nonZeroBalances[bot.currency].balance += parseFloat(bot.balance);
    } else if (bot.currency === "USDT") {
      usdtBalance += parseFloat(bot.balance);
    }
  }

  for (let [currency, data] of Object.entries(nonZeroBalances)) {
    const cryptoPrice = await getCryptoPrice(currency);

    if (cryptoPrice) {
      data.price = parseFloat(cryptoPrice.toFixed(8)); // Remove trailing zeros
    }
  }

  let nonZeroBalancesText = "";
  for (let [currency, data] of Object.entries(nonZeroBalances)) {
    const cryptoValueUSD = data.balance * data.price;
    nonZeroCryptoUSD += cryptoValueUSD;
    if (cryptoValueUSD > 1) {
      nonZeroBalancesText += ` <span class="white-label">${currency}</span> ${parseFloat(data.balance)}`; // Remove trailing zeros
    }
  }

  const totalBotBalance = usdtBalance + nonZeroCryptoUSD;

  if (Math.abs(usdtBalance - prevUsdtBalance) / prevUsdtBalance >= 0.01) {
    sendUsdtBalanceChange(usdtBalance);
    playAlarm();
    prevUsdtBalance = usdtBalance;
  }

  kucoinBotsEl.innerHTML = `<span class="white-label">Totals</span> $${totalBotBalance.toFixed(2)} <span class="white-label">USDT</span> ${usdtBalance.toFixed(2)}${nonZeroBalancesText}`;
}

updateKucoinBots();
setInterval(updateKucoinBots, 30000);

module.exports = {
  updateKucoinBots: updateKucoinBots
};