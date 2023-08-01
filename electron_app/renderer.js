const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list'); 
const balanceModal = document.getElementById("balance-modal");
const closeBtn = document.querySelector(".close");
const showBalanceModalBtn = document.getElementById("show-balance-modal");
const clockUpdater = require('./components/clock/clock');
const weatherUpdater = require('./components/weather/weather');
const alarmController = require('./components/alarm/alarm');
const { playAlarm,  initAlarmController, stopAlarm } = require('./components/alarm/alarm');
const cryptoController = require('./components/crypto/crypto');
const botController = require('./components/bot/bot');
const todo = require('./components/todo/todo');
const axios = require('axios');
const { ipcRenderer } = require('electron');

let taskAlarm = new Audio('media/ding.mp3');


let scheduleIndex = 0; // The current schedule
let timer = null; // The timer

class Timer {
  constructor() {
    this.startTime = null;
    this.scheduleTime = null;
  }

  start(scheduleTime) {
    this.startTime = new Date().getTime();
    this.scheduleTime = scheduleTime;
    this.tick();
  }

  tick() {
    const currentTime = new Date().getTime();
    if (currentTime - this.startTime >= this.scheduleTime) {
      onTaskComplete();
    } else {
      setTimeout(() => this.tick(), 1000); // Check every second
    }
  }
}

function resetScheduler() {
  // Reset variables
  scheduleIndex = 0;
  timer = null;
  
  // Change button text
  document.getElementById('start-day').innerText = "Start Day";
  
  // Update CSS classes
  const scheduleItems = document.querySelectorAll('#schedule-list li');
  scheduleItems.forEach((item, index) => {
    item.classList.remove('current');
    if (index === 0) {
      item.classList.add('current');
    }
  });

  console.log('Scheduler reset to the beginning of the day.');
}


function onTaskComplete() {
  playAlarm();
  const scheduleItems = document.querySelectorAll('#schedule-list li');
  scheduleItems[scheduleIndex].classList.remove('current');
  scheduleIndex++;
  if (scheduleIndex < scheduleItems.length) {
    scheduleItems[scheduleIndex].classList.add('current');
    startNextSchedule();
  } else {
    console.log('All tasks completed for the day.');
    resetScheduler();
  }
}

function startNextSchedule() {
  const schedules = Schedule.getSchedules();
  const schedule = schedules[scheduleIndex];
  const scheduleTime = Schedule.parseScheduleTime(schedule);
  timer = new Timer();
  timer.start(scheduleTime);
}

class Schedule {
  static getSchedules() {
    let schedules;
    try {
      if (localStorage.getItem('schedules') === null) {
        console.log('No existing schedules found in localStorage');
        schedules = [];
      } else {
        schedules = JSON.parse(localStorage.getItem('schedules'));
        console.log('Existing schedules loaded from localStorage: ', schedules);
      }
    } catch (error) {
      console.error('Error getting schedules from localStorage: ', error);
      schedules = [];
    }
    return schedules;
  }

  static addScheduleToList(schedule, list) {
    const li = document.createElement('li');
    li.textContent = schedule;
    if (list.childElementCount === 0) {
      li.classList.add('current');
    }
    li.addEventListener('dblclick', () => this.enableEdit(li));
    list.appendChild(li);
    console.log('Schedule item added to list: ', schedule);
  }
  

  static updateSchedule(input, li) {
    const schedules = this.getSchedules();
    const index = schedules.indexOf(input.value);
    schedules[index] = input.value;
    this.saveSchedules(schedules);
    console.log('Updated schedule at index ', index, ' with new value ', input.value);
    li.textContent = input.value;
  }

  static parseScheduleTime(schedule) {
    console.log("Processing schedule: " + schedule);
    const timeString = schedule.split(' - ')[0];
    console.log("Extracted time string: " + timeString);
    let totalTime = 0;

    const timeUnits = timeString.split(' ');
    console.log("Split time units: " + timeUnits);
    for (let i = 0; i < timeUnits.length; i += 2) {
        const value = parseInt(timeUnits[i]);
        const unit = timeUnits[i + 1];
        console.log("Current value and unit: " + value + ", " + unit);
        
        if (unit.startsWith('Min')) {
            totalTime += value * 60 * 1000;
        } else if (unit.startsWith('Hour')) {
            totalTime += value * 60 * 60 * 1000;
        }
        console.log("Total time after processing this unit: " + totalTime);
    }

    console.log("Final total time for schedule: " + totalTime);
    return totalTime;
  }

  static loadSchedules(scheduleList, addScheduleToList) {
    console.log('Loading schedules...');
    let schedules = this.getSchedules();
    // If there are no schedules, initialize with the default ones
    if(schedules.length === 0) {
      console.log('No schedules found. Creating default schedules.');
      schedules = ['1 Hour - Morning routine',
      '15 Min - Exercise',
      '1 Hour - Breakfast',
      '1 Hour - Mindfulness',
      '2 Hours - Dev/Stream/Vid/eBay',
      '15 Min - Exercise',
      '2 Hours - Dev/Stream/Vid/eBay',
      '1 Hour - Lunch',
      '2 Hours - Dev/Stream/Vid/eBay',
      '15 Min - Exercise',
      '2 Hours - Dev/Stream/Vid/eBay',
      '1 Hour - Mindfulness',
      '2 Hour - Self Work/Brainstorm',
      '1 Hour - Dinner',
      '2 Hour - Leisure',
      '30 Min - Plan for next day',
      '30 Min - Bedtime routine']
      ;
      this.saveSchedules(schedules);
    }
    console.log('Schedules to be loaded: ', schedules);
    schedules.forEach(schedule => addScheduleToList(schedule, scheduleList));
    console.log('Schedules successfully loaded');
  }

  static saveSchedules(schedules) {
    try {
      localStorage.setItem('schedules', JSON.stringify(schedules));
      console.log('Schedules saved to localStorage: ', schedules);
    } catch (error) {
      console.error('Error saving schedules to localStorage: ', error);
    }
  }
}

const scheduleList = document.getElementById('schedule-list'); // You will need to provide the correct ID for the list element
Schedule.loadSchedules(scheduleList, Schedule.addScheduleToList);
document.getElementById('start-day').addEventListener('click', () => {
  if (timer) {
    console.log('Day has already started.');
    document.getElementById('start-day').innerText = "Scheduler";
    return;
  }
  startNextSchedule();
});

const SERVER_URL = 'http://localhost:3001';

const io = require('socket.io-client');
let socket = io.connect('https://tradingbotserver-974d149be957.herokuapp.com');  // Change this to your server's URL

// Load previous trade type
let lastTradeType = localStorage.getItem('lastTradeType') || null;

// Listen for trade events from server
socket.on('newTrade', (data) => {
  const { tradeType } = data;
  console.log('tradetype', tradeType);

  // Compare with the last trade type stored in local storage
  if (tradeType !== lastTradeType) {
    // Send a message to the server to execute the trade
    socket.emit('executeTrade', { execute: true, data });

    // Update the last trade type in local storage
    localStorage.setItem('lastTradeType', tradeType);
  } else {
    // If the tradeType is the same, tell the server not to execute the trade
    console.log('no')
  }
});

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

//Init bot data
botController.updateKucoinBots(playAlarm);


//Init todo's
todoForm.addEventListener('submit', function(event) {
  event.preventDefault();
  if (todoInput.value.trim()) {
    todo.addTodoToList(todoInput.value, todoList);
    todo.saveTodos(todoList);
    todoInput.value = '';
  }
});

todo.loadTodos(todoList, todo.addTodoToList);


document.getElementById('user-input').addEventListener('keydown', async (event) => {
  if (event.keyCode === 13 && document.activeElement === document.getElementById('user-input')) {
      event.preventDefault(); // prevent the default action
      const prompt = document.getElementById('user-input').value;
      recognition.stop(); // Stop the recognition
      startSpeechRecognition = false; // Reset the speech recognition flag
      transcript = ''; // Clear the transcript
      try {
          document.getElementById('user-input').value = '';
          ipcRenderer.send('open-chat-window', prompt);  
          // ipcRenderer.send('forward-to-chat', { prompt: prompt }); // Forward the message to the chat window
      } catch (error) {
          console.error(error);
      }
  }
});


document.getElementById('open-chat-button').addEventListener('click', () => {
  ipcRenderer.send('open-chat-window', '');
});