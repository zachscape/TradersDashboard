const axios = require('axios');
const cryptoEl = document.getElementById('crypto-container');
const SERVER_URL = 'http://localhost:3001';

async function updateCrypto() {
  const cryptoData = await axios.get(`${SERVER_URL}/crypto`);

  const cryptoText = cryptoData.data.kucoin
    .map((crypto) => {
      const formattedPrice = parseFloat(crypto.price).toString().replace(/(\.\d*?[1-9])0+$/, '$1'); // Remove trailing zeros
      const hourTrend = crypto.trends['1hour'];
      const dayTrend = crypto.trends['1day'];

      let hourTrendSymbol, dayTrendSymbol;
      if (hourTrend === 'upward') {
        hourTrendSymbol = '<span class="green"></span>';
      } else if (hourTrend === 'downward') {
        hourTrendSymbol = '<span class="red"></span>';
      } else {
        hourTrendSymbol = '<span class="blue"></span>';
      }

      if (dayTrend === 'upward') {
        dayTrendSymbol = '<span class="green"></span>';
      } else if (dayTrend === 'downward') {
        dayTrendSymbol = '<span class="red"></span>';
      } else {
        dayTrendSymbol = '<span class="blue"></span>';
      }

      return `<span class="white-label">${crypto.pair.split("/")[0]}</span> 
        $${formattedPrice} ${hourTrendSymbol} ${dayTrendSymbol}`;
    })
    .join(" ");

  cryptoEl.innerHTML = cryptoText;

  const btcUsdData = cryptoData.data.kucoin.find((crypto) => crypto.pair === "BTC/USDT");

  return btcUsdData ? parseFloat(btcUsdData.price) : 0;
}

function startUpdatingCrypto() {
  updateCrypto();
  setInterval(updateCrypto, 30 * 1000);
}

startUpdatingCrypto();

module.exports = {
  startUpdatingCrypto: startUpdatingCrypto
};
