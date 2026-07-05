alert("NEW APP.JS");
function initScreenHealth() {

    const screenStartBtn = document.getElementById("screenTimerStart");
    const screenPauseBtn = document.getElementById("screenTimerPause");
    const screenResetBtn = document.getElementById("screenTimerReset");

    const screenDisplay = document.getElementById("screenTimeDisplay");
    const breakDisplay = document.getElementById("breakCountdown");
    const breakStatus = document.getElementById("breakStatus");
    const reminderCheckbox = document.getElementById("enableBreakReminder");

    const strainLevel = document.getElementById("strainLevel");
    const strainRecommendation = document.getElementById("strainRecommendation");

    // Exit if this page isn't loaded
    if (
        !screenStartBtn ||
        !screenPauseBtn ||
        !screenResetBtn ||
        !screenDisplay ||
        !breakDisplay ||
        !breakStatus ||
        !reminderCheckbox ||
        !strainLevel ||
        !strainRecommendation
    ) {
        return;
    }

    let screenSeconds = 0;
    let breakSeconds = 20 * 60;
    let timer = null;

    function formatHMS(seconds) {
        const hrs = Math.floor(seconds / 3600).toString().padStart(2, "0");
        const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
        const secs = (seconds % 60).toString().padStart(2, "0");

        return `${hrs}:${mins}:${secs}`;
    }

    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
        const secs = (seconds % 60).toString().padStart(2, "0");

        return `${mins}:${secs}`;
    }

    function updateDisplay() {

        screenDisplay.textContent = formatHMS(screenSeconds);
        breakDisplay.textContent = formatTime(breakSeconds);

        if (screenSeconds < 20 * 60) {
            strainLevel.textContent = "Low";
            strainRecommendation.textContent = "Monitor screen time";
        }
        else if (screenSeconds < 40 * 60) {
            strainLevel.textContent = "Medium";
            strainRecommendation.textContent = "Take a short break soon";
        }
        else {
            strainLevel.textContent = "High";
            strainRecommendation.textContent = "Take a break immediately";
        }
    }

    screenStartBtn.addEventListener("click", function () {

        if (timer) return;

        timer = setInterval(function () {

            screenSeconds++;

            if (reminderCheckbox.checked) {

                breakSeconds--;

                breakStatus.textContent = "Next break in";

                if (breakSeconds <= 0) {

                    alert("20-20-20 Reminder\n\nLook at something 20 feet away for 20 seconds.");

                    breakSeconds = 20 * 60;
                }

            } else {

                breakStatus.textContent = "Reminder Disabled";
            }

            updateDisplay();

        }, 1000);

    });

    screenPauseBtn.addEventListener("click", function () {

        clearInterval(timer);
        timer = null;

    });

    screenResetBtn.addEventListener("click", function () {

        clearInterval(timer);
        timer = null;

        screenSeconds = 0;
        breakSeconds = 20 * 60;

        breakStatus.textContent = "Reminder Enabled";

        updateDisplay();

    });

    reminderCheckbox.addEventListener("change", function () {

        if (this.checked) {

            breakStatus.textContent = "Reminder Enabled";
            breakSeconds = 20 * 60;

        } else {

            breakStatus.textContent = "Reminder Disabled";
        }

        updateDisplay();

    });

    updateDisplay();
}
document.addEventListener("DOMContentLoaded", function () {
    initScreenHealth();
});