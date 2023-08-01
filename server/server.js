require("dotenv").config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const crypto = require('crypto');
const ipaddr = require('ipaddr.js');
const http = require('http');
const { Server } = require('socket.io');

const TelegramBot = require('node-telegram-bot-api');

const technicalIndicators = require('technicalindicators');

const bodyParser = require('body-parser');

const API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

//Recieve a phone notification when your bot USDT balance changes (bot made a trade)
//Create a telegram bot get its token, send it a request & log the chat id for first time setup
const TELEGRAM_BOT_TOKEN = '6229171714:AAG66EOGBiFRMXsPpq9DhcTX0z37Pdm9Ukg';  // Replace with your bot token
const TELEGRAM_CHAT_ID = '6286039179';  // Replace with your chat id

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: false });

// Function to send a message via your Telegram bot
function sendTelegramMessage(text) {
  bot.sendMessage(TELEGRAM_CHAT_ID, text);
}

const app = express();
app.use(cors());
// to support JSON-encoded bodies
app.use(bodyParser.json());

// to support URL-encoded bodies
app.use(bodyParser.urlencoded({
  extended: true
}));

const KUCOIN_API_KEY = '646ec3653b93ab000140ee6f';
const KUCOIN_SECRET_KEY = '345092d7-e68a-4b36-9d0d-7e7d005a6302';
const KUCOIN_PASSPHRASE = 'monitor1';
const OPEN_WEATHER_MAP_API_KEY = 'cef37e113f5926fa0787d0b75601e322';


app.get('/weather', async (req, res) => {
  try {
    let ipAddress = req.ip;
    if (ipAddress.substr(0, 7) === '::ffff:') {
      ipAddress = ipAddress.substr(7);
    }
    //ENTER YOUR IP FOR LOCAL WEATHER DATA//
    const parsedIp = ipaddr.process('73.90.54.140');

    const locationResponse = await axios.get(`http://ip-api.com/json/${parsedIp}`);

    const { lat, lon } = locationResponse.data;

    if (lat === undefined || lon === undefined) {
      console.error('Latitude or longitude is undefined.');
      res.status(400).json({ error: 'Latitude or longitude is undefined.' });
    } else {
      const weatherResponse = await axios.get(`https://api.openweathermap.org/data/2.5/onecall?lat=37.341778&lon=-120.607224&exclude=minutely,alerts&units=metric&appid=${OPEN_WEATHER_MAP_API_KEY}`);
      res.json(weatherResponse.data);
    }
  } catch (error) {
    console.error('Error fetching weather data:', error.message);
    res.status(500).send('Error fetching weather data');
  }
});

async function fetchOHLCV(symbol, timeframe) {
  const path = `/api/v1/market/candles?symbol=${symbol}&type=${timeframe}`;
  const url = `https://api.kucoin.com${path}`;
  const response = await axios.get(url);

  if (response && response.status === 200) {
    return response.data && response.data.data;
  } else {
    console.error('Error fetching Kucoin OHLCV data:', response.statusText, response.data);
    throw new Error('Error fetching Kucoin OHLCV data');
  }
}

app.get('/crypto', async (req, res) => {
  try {
    const pairs = ['BTC-USDT', 'LTC-USDT', 'DOGE-USDT', 'XRP-USDT', 'WLD-USDT'];
    const timeframes = ['1hour', '1day'];
    const kucoinData = await Promise.all(pairs.map(async (pair) => {
      const response = await axios.get(`https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=${pair}`);
      const price = response.data.data.price;
      const ohlcv = {};
      const trends = {};

      await Promise.all(timeframes.map(async (timeframe) => {
        const data = await fetchOHLCV(pair, timeframe);
        ohlcv[timeframe] = data;
        const closes = data.map(candle => parseFloat(candle[4]));

        let rsi, macd, sma;
        if (closes.length >= 14) {
          rsi = technicalIndicators.RSI.calculate({ values: closes, period: 14 });
        }
        if (closes.length >= 26) {
          macd = technicalIndicators.MACD.calculate({ values: closes, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9, SimpleMAOscillator: false, SimpleMASignal: false });
        }
        if (closes.length >= 15) {
          sma = technicalIndicators.SMA.calculate({ values: closes, period: 15 });
        }

        // Get the most recent values
        const recentRSI = rsi ? rsi[rsi.length - 1] : null;
        const recentMACD = macd ? macd[macd.length - 1].histogram : null; // Use the histogram value for trend determination
        const recentSMA = sma ? sma[sma.length - 1] : null;
        const recentClose = closes[closes.length - 1];

        // Determine the trend based on the indicators
        const isUpwardTrend = recentRSI > 50 && recentMACD > 0 && recentClose > recentSMA;
        const isDownwardTrend = recentRSI < 50 && recentMACD < 0 && recentClose < recentSMA;

        if (isUpwardTrend) {
          trends[timeframe] = 'upward';
        } else if (isDownwardTrend) {
          trends[timeframe] = 'downward';
        } else {
          trends[timeframe] = 'neutral';
        }
      }));


      return { pair: pair.replace('-', '/'), price, ohlcv, trends };
    }));

    res.json({ kucoin: kucoinData });

  } catch (error) {
    console.error('Error fetching crypto data:', error.message);
    res.status(500).send('Error fetching crypto data');
  }
});



function signRequest(path, secret, timestamp, method = 'GET', params = '') {
  const paramsString = (typeof params === 'object') ? JSON.stringify(params) : params;
  const what = timestamp + method + path + paramsString;
  const hmac = crypto.createHmac('sha256', secret);
  const signature = hmac.update(what).digest('base64');
  return signature;
}


async function fetchTradingHistory(apiKey, secretKey, passphrase, symbol) {
  const path = '/api/v1/fills';
  const method = 'GET';
  const queryParams = `?symbol=${symbol}&page=1&pageSize=100`;
  const url = `https://api.kucoin.com${path}${queryParams}`;
  const timestamp = Date.now().toString();

  const signature = signRequest(path, secretKey, timestamp, method, queryParams);

  const config = {
    headers: {
      'KC-API-SIGN': signature,
      'KC-API-TIMESTAMP': timestamp,
      'KC-API-KEY': apiKey,
      'KC-API-PASSPHRASE': passphrase,
      'KC-API-KEY-VERSION': '1',
    },
  };

  const response = await axios.get(url, config);

  if (response && response.status === 200) {
    return response.data && response.data.data;
  } else {
    console.error('Error fetching Kucoin trading history:', response.statusText, response.data);
    throw new Error('Error fetching Kucoin trading history');
  }
}

async function getKucoinBots() {
  try {
    const path = '/api/v1/accounts';
    const method = 'GET';
    const queryParams = '';
    const url = `https://api.kucoin.com${path}${queryParams}`;
    const timestamp = Date.now().toString();

    const signature = signRequest(path, KUCOIN_SECRET_KEY, timestamp, method, queryParams);

    const config = {
      headers: {
        'KC-API-SIGN': signature,
        'KC-API-TIMESTAMP': timestamp,
        'KC-API-KEY': KUCOIN_API_KEY,
        'KC-API-PASSPHRASE': KUCOIN_PASSPHRASE,
        'KC-API-KEY-VERSION': '1',
      },
    };

    const response = await axios.get(url, config);

    if (response && response.data && response.data.data) {
      const nonZeroBalances = response.data.data.filter(account => parseFloat(account.balance) > 0);
      const history = await Promise.all(nonZeroBalances.map(account => fetchTradingHistory(KUCOIN_API_KEY, KUCOIN_SECRET_KEY, KUCOIN_PASSPHRASE, `${account.currency}-USDT`)));

      return { nonZeroBalances, history };
    } else {
      console.error('Error fetching Kucoin account data:', response.statusText);
      throw new Error('Error fetching Kucoin account data');
    }
  } catch (error) {
    console.error('Error fetching Kucoin account data:', error.message);
    throw new Error('Error fetching Kucoin account data');
  }
}


app.get('/kucoinBots', async (req, res) => {
  try {
    const { nonZeroBalances, history } = await getKucoinBots();

    res.json({ nonZeroBalances, history });

  } catch (error) {
    console.error('Error fetching Kucoin sub user data:', error.message);
    res.status(500).send('Error fetching Kucoin sub user data');
  }
});

let prevUsdtBalance = null;

async function checkBalanceChange(newBalance) {
  const usdtBalance = parseFloat(newBalance);



  // Send a Telegram message whenever USDT balance changes
  sendTelegramMessage(`Check Market: USDT balance changed from ${prevUsdtBalance} to ${usdtBalance}`);

  prevUsdtBalance = usdtBalance;
}



app.post('/usdtBalanceChanged', async (req, res) => {
  try {

    const newBalance = req.body.balance;
    await checkBalanceChange(newBalance);
    res.sendStatus(200);  // OK
  } catch (error) {
    console.error('Error checking balance change:', error.message);
    res.status(500).send('Error checking balance change');
  }
});

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${API_KEY}`,
};

//post to openai
app.post('/generate-text', async (req, res) => {
  const { prompt } = req.body;

  try {
    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-4',
        messages: [{ "role": "user", "content": prompt }],

      },
      { headers }
    );
    console.log(response)
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error response from OpenAI API:', error.response.data);
    res.status(500).json({ message: 'An error occurred while processing the request.' });
  }
});



const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

io.on('connection', (socket) => {
 console.log('lalala')
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
