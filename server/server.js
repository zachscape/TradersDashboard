require("dotenv").config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const crypto = require('crypto');
const CryptoJS = require('crypto-js');
const ipaddr = require('ipaddr.js');
const http = require('http');
const { Server } = require('socket.io');
const cache = require('memory-cache');
const TelegramBot = require('node-telegram-bot-api');

const technicalIndicators = require('technicalindicators');

const bodyParser = require('body-parser');

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const app = express()
;
app.use(cors());

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({
  extended: true
}));

// Set cache middleware
let cacheMiddleware = (duration) => {
  return (req, res, next) => {
    let key = '__express__' + req.originalUrl || req.url;
    let cachedBody = cache.get(key);
    if (cachedBody) {
      res.send(cachedBody);
      return;
    } else {
      res.sendResponse = res.send;
      res.send = (body) => {
        cache.put(key, body, duration * 1000);
        res.sendResponse(body);
      };
      next();
    }
  };
};
//after key and ip saved to local storage, send request here. Same for /balances
app.get('/weather', cacheMiddleware(60), async (req, res) => {
  try {
    const { apiKey, ipAddress } = req.query;

    const parsedIp = ipaddr.process(ipAddress);

    const locationResponse = await axios.get(`http://ip-api.com/json/${parsedIp}`);

    const { lat, lon } = locationResponse.data;

    if (lat === undefined || lon === undefined) {
      console.error('Latitude or longitude is undefined.');
      res.status(400).json({ error: 'Latitude or longitude is undefined.' });
    } else {
      const weatherResponse = await axios.get(`https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely,alerts&units=metric&appid=${apiKey}`);
      res.json(weatherResponse.data);
    }
  } catch (error) {
    console.error('Error fetching weather data:', error.message);
    res.status(500).send('Error fetching weather data');
  }
});

const MEXC_API_URL = 'https://www.mexc.com';

const { Spot } = require('mexc-api');

app.get('/crypto', cacheMiddleware(60), async (req, res) => {
  try {
    const pairs = ['BTC-USDT', 'LTC-USDT', 'XRP-USDT', 'DOGE-USDT', 'ETH-USDT'];
    const mexcData = await Promise.all(pairs.map(async (pair) => {
      // MEXC uses lowercase symbols separated by underscore
      const mexcPair = pair.toLowerCase().replace('-', '_');
      const response = await axios.get(`${MEXC_API_URL}/open/api/v2/market/ticker?symbol=${mexcPair}`);
      const price = response.data.data[0].last; // Get the "last" price

      return { pair: pair.toUpperCase().replace('_', '/'), price };
    }));
    res.json({ mexc: mexcData });

  } catch (error) {
    console.error('Error fetching crypto data:', error.message);
    res.status(500).send('Error fetching crypto data');
  }
});

app.get('/balances', async (req, res) => {
  try {
    const { apiKey, apiSecret } = req.query;

    const spot = new Spot({
      apiKey,
      apiSecret
    });

    const data = await spot.accountInformation();
    res.json(data.balances);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


