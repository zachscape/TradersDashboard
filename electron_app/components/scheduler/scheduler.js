const playAlarm = require("../alarm/alarm");

let scheduleIndex = 0; // The current schedule
let timer = null; // The timer

class Timer {
  constructor() {
    this.startTime = null;
    this.scheduleTime = null;
    this.displayElement = document.getElementById('start-day');
  }

  start(scheduleTime) {
    this.startTime = new Date().getTime();
    this.scheduleTime = scheduleTime;
    this.tick();
  }

  tick() {
    const currentTime = new Date().getTime();
    const timeLeft = this.scheduleTime - (currentTime - this.startTime);
    this.displayElement.innerText = this.formatTime(timeLeft);
    if (timeLeft <= 0) {
      onTaskComplete();
    } else {
      setTimeout(() => this.tick(), 1000); // Check every second
    }
  }

  formatTime(timeInMilliseconds) {
    const seconds = Math.floor((timeInMilliseconds / 1000) % 60);
    const minutes = Math.floor((timeInMilliseconds / (1000 * 60)) % 60);
    const hours = Math.floor((timeInMilliseconds / (1000 * 60 * 60)) % 24);
    
    // Use padStart to ensure 2 significant figures for minutes
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(seconds).padStart(2, '0');
    
    return `${hours}h${formattedMinutes}m${formattedSeconds}s`;
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

let isMuted = false;

function onTaskComplete() {
  if (!isMuted) {
    playAlarm();
  }
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

function toggleMute() {
  isMuted = !isMuted;
  const muteButton = document.getElementById('mute-button'); 
  if (isMuted) {
    muteButton.classList.add('muted'); 
    muteButton.innerText = 'Muted';
  } else {
    muteButton.classList.remove('muted');
    muteButton.innerText = 'Mute';
  }
}

document.getElementById('mute-button').addEventListener('click', toggleMute);

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
      schedules = ['15 Min - Breakfast',
      '20 Min - Exercise',
      '45 Min - Mindfulness',
      '1 Hour - Games',
      '3 Hour - Productivity',
      '15 Min - Food',
      '20 Min - Exercise',
      '2 Hour - Productivity',
      '20 Min - Exercise',
      '2 Hour - Productivity',
      '30 Min - Food',
      '4 Hour - TV/Games',
      '45 Min - Mindfulness',]
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

function runScheduler() {
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
}

module.exports = runScheduler;