const axios = require('axios');
const cryptoEl = document.getElementById('crypto-container');
const SERVER_URL = 'http://localhost:3001';

async function updateCrypto() {
  const cryptoData = await axios.get(`${SERVER_URL}/crypto`);

  const cryptoText = cryptoData.data.mexc
    .map((crypto) => {
      const formattedPrice = parseFloat(crypto.price).toString().replace(/(\.\d*?[1-9])0+$/, '$1'); // Remove trailing zeros
     

      return `<span class="white-label">${crypto.pair.split("-")[0]}</span> 
        $${formattedPrice}`;
    })
    .join(" ");

  cryptoEl.innerHTML = cryptoText;

  const btcUsdData = cryptoData.data.mexc.find((crypto) => crypto.pair === "BTC/USDC");

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
