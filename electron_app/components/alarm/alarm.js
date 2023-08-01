const { ipcRenderer } = require('electron');

let alarmMode = "quiet";
let alarmAudio = null;
let alarmTimeout = null;

function initAlarmController() {
    let slider = document.querySelector(".slider");
    let loudSwitch = document.getElementById("loud-switch");

    slider.addEventListener("click", () => {
        loudSwitch.checked = !loudSwitch.checked;
        alarmMode = loudSwitch.checked ? "loud" : "quiet";
        updateSliderClass();
    });

    function updateSliderClass() {
        if (alarmMode === "loud") {
            slider.classList.remove("quiet");
            slider.classList.add("loud");
        } else {
            slider.classList.remove("loud");
            slider.classList.add("quiet");
        }
    }

    // Call updateSliderClass() once to set the initial appearance
    updateSliderClass();

    document.getElementById("alarm-off").addEventListener("click", () => {
        stopAlarm();
    });
    document.addEventListener('keyup', function(event) {
        // The keyCode for the 'Up Arrow' key is 38.
        if (event.keyCode === 38) {
            stopAlarm();
        }
    });
}

function playAlarm() {
    let audioFile;
    let volume;

    if (alarmMode === "loud") {
        audioFile = "media/loud-alarm.mp3";
        volume = 1.0;
    } else {
        audioFile = "media/ding.mp3";
        volume = 1.0;
    }

    if (alarmAudio) {
        alarmAudio.pause();
        alarmAudio.currentTime = 0;
    }

    alarmAudio = new Audio(audioFile);
    alarmAudio.volume = volume;
    alarmAudio.play();

    if (alarmTimeout) {
        clearTimeout(alarmTimeout); // Clear the previous timeout if exists
    }

    alarmTimeout = setTimeout(() => {
        stopAlarm();
    }, 2000);
}


function stopAlarm() {
    if (alarmAudio) {
        alarmAudio.pause();
        alarmAudio.currentTime = 0;
    }
    if (alarmTimeout) {
        clearTimeout(alarmTimeout); // Clear the timeout when the alarm is stopped
    }
}

//Global escape key to stop alarm with Esc while tabbed
ipcRenderer.on('stop-alarm', () => {
    stopAlarm();
});

module.exports = {
    initAlarmController: initAlarmController,
    playAlarm: playAlarm,
    stopAlarm: stopAlarm
};
