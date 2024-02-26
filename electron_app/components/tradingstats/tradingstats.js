const fs = require('fs');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const axios = require('axios');

let avgDailyProfitPercent = 0;
let avgMonthlyProfitPercent = 0;
let avgYearlyProfitPercent = 0;

const readCsv = (filename) => {
  return new Promise((resolve, reject) => {
    const trades = [];
    fs.createReadStream(`./media/${filename}`)
      .pipe(csv())
      .on('data', (data) => trades.push(data))
      .on('end', () => resolve(trades))
      .on('error', (error) => reject(error));
  });
};

function tradingstats() {
  return new Promise((resolve, reject) => {
    Promise.all([readCsv('strategy1.csv'), readCsv('strategy2.csv'), readCsv('strategy3.csv')])
      .then((results) => {
        let combinedTrades = [].concat(...results);
        combinedTrades.sort((a, b) => new Date(a['Date/Time']) - new Date(b['Date/Time']));

        let uniqueTrades = [];
        let tradeMap = new Map();
        for (let trade of combinedTrades) {
          if (trade['Trade #'] && trade['Type'] && trade['Signal'] && trade['Date/Time'] && trade['Profit %']) {
            let tradeKey = `${trade['Trade #']}-${trade['Type']}-${trade['Signal']}-${trade['Date/Time']}`;
            if (!tradeMap.has(tradeKey)) {
              tradeMap.set(tradeKey, true);
              uniqueTrades.push(trade);
            }
          }
        }

        const csvWriter = createCsvWriter({
          path: './media/generated.csv',
          header: Object.keys(uniqueTrades[0]).map((id) => ({ id, title: id })),
        });
        csvWriter.writeRecords(uniqueTrades).then(() => {
          setTimeout(() => {
            let totalProfitPercent = uniqueTrades.reduce((sum, trade) => sum + parseFloat(trade['Profit %']), 0);

            const months = (new Date(uniqueTrades[uniqueTrades.length - 1]['Date/Time']) - new Date(uniqueTrades[0]['Date/Time'])) / (1000 * 60 * 60 * 24 * 30);
            avgMonthlyProfitPercent = totalProfitPercent / months;

            avgDailyProfitPercent = avgMonthlyProfitPercent / 30.5;
            avgYearlyProfitPercent = avgMonthlyProfitPercent * 12;

            resolve({
              avgDailyProfitPercent,
              avgMonthlyProfitPercent,
              avgYearlyProfitPercent
            });
          }, 5000);
        });
      })
      .catch((error) => {
        console.error(error);
        reject(error);
      });
  });
}

module.exports = tradingstats;