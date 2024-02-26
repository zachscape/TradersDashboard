# datamonitor
<p align="center">
<img src="https://github.com/zachscape/TradersDashboard/blob/main/TradersDashboardImage.png" />
</p>
Electron.js and Node.js application for Windows that provides real-time weather data and cryptocurrency prices and balances. It uses the OpenWeatherMap and MEXC APIs to fetch this data.

## Features

- Display current, hourly, and daily weather data.
- Show the total balance and individual balances of cryptocurrencies with a non-zero balance in the API key holder's account.
- Store the total balance in local storage every 24 hours, and rendered in a table viewed when "history" is clicked.
- Combine up to 3 trading strategies csv files from tradingview and displays profit over time. Name csv files as "strategy1", "strategy2", and "strategy3" and place them in electron_app/media.
- Drag and drop todo list.
- Daily activity scheduler.

## Prerequisites

- Node.js installed
- You have obtained API keys from api.OpenWeatherMap.com and MEXC.

## Installing 

1. Clone the repo: `git clone https://github.com/yourusername/TradersDashboard.git`
2. Install the dependencies: `npm install`
3. Run the app: `npm start`

## Starting App

-Simply double click "start_app.bat" in root directory to run the client and server simultaneously.

## Closing App

-For now, close both the client and server by going to the opened command prompts and use ctrl + c to terminate both.

## Editing the Scheduler

To edit the daily activity scheduler, modify lines 170 to 182 in `electon_app/components/scheduler/scheduler.js`. To clear the schedules in local storage, open the Electron.js app's console (ctrl+shift+I) and paste in this command: `localStorage.removeItem('schedules');`. You may need to repeat this command a few times and terminate the front-end console with ctrl+c right after clearing the schedules in local storage, then restart the app.

## Data Storage

All data is saved locally on your machine and is not collected by any other party.
