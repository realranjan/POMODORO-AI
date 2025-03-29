// Sound files
const startSound = new Audio(chrome.runtime.getURL('sounds/start.mp3'));
const breakSound = new Audio(chrome.runtime.getURL('sounds/break.mp3'));
const completeSound = new Audio(chrome.runtime.getURL('sounds/complete.mp3'));

// Setup alarm listener to handle timer expiration
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'pomodoroTimer') {
    // Get current timer state
    chrome.storage.local.get(['timerState'], (result) => {
      if (result.timerState) {
        const { mode, pomodorosCompleted } = result.timerState;
        
        // Determine what type of notification to show
        if (mode === 'pomodoro') {
          // Pomodoro session completed
          const newPomodorosCompleted = (pomodorosCompleted || 0) + 1;
          
          // Determine which break to take
          const nextMode = newPomodorosCompleted % 4 === 0 ? 'longBreak' : 'shortBreak';
          const breakTime = nextMode === 'longBreak' ? 15 * 60 * 1000 : 5 * 60 * 1000;
          
          // Play break sound
          breakSound.play().catch(err => console.log('Error playing sound:', err));
          
          // Create notification
          chrome.notifications.create('', {
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: 'Pomodoro Complete!',
            message: 'Great job! Time for a break.',
            priority: 2
          });
          
          // Update timer state
          chrome.storage.local.set({
            timerState: {
              endTime: Date.now() + breakTime,
              mode: nextMode,
              running: true,
              pomodorosCompleted: newPomodorosCompleted
            }
          });
          
          // Set new alarm for break
          chrome.alarms.create('pomodoroTimer', {
            when: Date.now() + breakTime
          });
        } else {
          // Break completed
          const pomodoroDuration = 25 * 60 * 1000; // 25 minutes
          
          // Play complete sound
          completeSound.play().catch(err => console.log('Error playing sound:', err));
          
          // Create notification
          chrome.notifications.create('', {
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: 'Break Complete',
            message: 'Back to work! Start your next Pomodoro.',
            priority: 2
          });
          
          // Update timer state
          chrome.storage.local.set({
            timerState: {
              endTime: Date.now() + pomodoroDuration,
              mode: 'pomodoro',
              running: true,
              pomodorosCompleted: pomodorosCompleted
            }
          });
          
          // Set new alarm for pomodoro
          chrome.alarms.create('pomodoroTimer', {
            when: Date.now() + pomodoroDuration
          });
        }
      }
    });
  }
});

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startTimer') {
    const { duration, mode, pomodorosCompleted } = message;
    
    // Play start sound if starting a pomodoro
    if (mode === 'pomodoro') {
      startSound.play().catch(err => console.log('Error playing sound:', err));
    }
    
    // Clear any existing alarms
    chrome.alarms.clear('pomodoroTimer');
    
    // Create new alarm
    chrome.alarms.create('pomodoroTimer', {
      when: Date.now() + duration
    });
    
    sendResponse({ success: true });
    return true;
  } else if (message.action === 'stopTimer') {
    // Clear the alarm
    chrome.alarms.clear('pomodoroTimer', (wasCleared) => {
      sendResponse({ success: wasCleared });
    });
    return true;
  }
}); 