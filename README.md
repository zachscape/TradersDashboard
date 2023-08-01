# datamonitor
<p align="center">
<img src="" alt="Andromasoft logo"/>
</p>

<b>Full-Stack Windows Data Monitor App</b>
  - Monitors Kucoin exchange price & trading bot data
  - Uses RSI, MACD and SMA to display 1hr & 24hr price trends
  - Displays day of week, date, time 
  - Fetches current, hourly & daily weather data at 1 location 
  - Todo list using local storage
  - Electron.js, Node.js

<b><b>Installation (windows 10/11)</b></b>
  - Download & Install Node.js
  - Download and extract project
  - Open terminal (cmd), navigate to datamonitor/electron_app & type "npm install"
  - Once finished, type "cd .." to go back to the root directory
  - type cd server to navigate to the server
  - type "npm install" 
  - close terminal
  - double click start_app.bat located in the root of the project "datamonitor/start_app.bat"
  - exit the app by closing both terminals with "Ctrl + c" when each is selected, making sure both the server and client processes have stopped.
  
<b><b>API key setup</b></b>
  - For weather data, you must obtain a key from https://api.openweathermap.org and edit the server.js file
    in 2 places. It is located in datamonitor/server/server.js. You must enter your key on line 39
    const OPEN_WEATHER_MAP_API_KEY = 'YOURKEY' and enter your ip address on line 49 for ipaddr to get your
    location from your ip on line 49: const parsedIp = ipaddr.process('your ip'). Get your ip by searching "whats my ip"
  - For kucoin crypto data, obtain a key from <a href='https://kucoin.com'>Kucoin</a>, making an account if 
    you don't have one already, then account in top right -> api management -> Create API
    -Place your key on line 36 and secret on 37 const KUCOIN_API_KEY = 'YOUR_SECRET';
     const KUCOIN_SECRET_KEY = 'YOUR_KEY'
  - You change the pairs you want to follow in the /crypto route in the server on line 83, make sure to keep
    the same syntax and that kucoin lists the pair. The Bot section loops through all your active bots and displays
    the whole total and each individial crypto total.
  - Save the server and start the app

  <b><b>Daily Scheduler setup</b></b>
  - Open the app in vs code and navigate to line 157 in renderer.js within mainrepo/electron_app/renderer.js.
  - Enter your own schedule values, keeping the formatting the same 2 digit time with "Min" or "Hours" after a space then "-" then your task. 
  - A ding sound is played at the end of each task.
  - After you finish entering your schedule, start the app and while the app is selected, enter "ctrl + shift + I" and paste in this command to clear the default schedule, then close the app by exiting both terminals with "ctrl + c" and start the app with your schedule loaded. Double click start day when you wake up, and over time, you will stay more on task.
