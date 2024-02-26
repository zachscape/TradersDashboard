
class Alarm {
  constructor(schedule) {
    this.schedule = schedule;
    this.audio = new Audio('media/ding.mp3'); 
    this.alarmTimeout = null;
  }

  getAlarmTime() {
    return this.schedule.slice(0, 5);
  }

  stopAlarm() {
    this.audio.pause();
    this.audio.currentTime = 0;
  }

  checkAlarmClock() {
    const currentTime = new Date();
    let [alarmHour, alarmMinutes] = this.getAlarmTime().split(':');

    alarmHour = parseInt(alarmHour);
    alarmMinutes = parseInt(alarmMinutes);

    if (currentTime.getHours() < 12 && alarmHour === 12) {
      alarmHour = 0;
    } else if (currentTime.getHours() >= 12 && alarmHour < 12) {
      alarmHour += 12;
    }

    if (alarmHour === currentTime.getHours() && alarmMinutes === currentTime.getMinutes()) {
      this.audio.play();

      this.alarmTimeout = setTimeout(() => this.stopAlarm(), 5000);
    }
  }
}



function updateClock() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    month: "numeric",
    day: "numeric",
  });

  let formattedTime = formatter.format(now).replace(/,/g, "");
  const hour = now.getHours();
  const amPm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  const minute = now.getMinutes();

  formattedTime = formattedTime.replace(/\d{1,2}:\d{2}\s(?:AM|PM)/, `${hour12}:${minute.toString().padStart(2, '0')}<span class="ampm">${amPm}</span>`);

  document.getElementById("clock").innerHTML = formattedTime;
   const schedules = JSON.parse(localStorage.getItem('schedules')) || [];
   const alarms = schedules.map(schedule => new Alarm(schedule));
   alarms.forEach(alarm => alarm.checkAlarmClock());
}

module.exports = {
  updateClock: updateClock
};