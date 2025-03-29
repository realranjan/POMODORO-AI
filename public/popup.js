// Audio polyfill for environments where Audio is not defined
if (typeof Audio === 'undefined') {
  class Audio {
    constructor(url) {
      this.url = url;
    }
    
    play() {
      console.log('Audio playback not supported in this context');
      return Promise.resolve();
    }
  }
  
  window.Audio = Audio;
}

// Google API key for AI functionality
const API_KEY = 'AIzaSyAUVuas3PtGUedngTIgxIvJNiJ2T33b54g'; 

// DOM Elements
const minutesElement = document.getElementById('minutes');
const secondsElement = document.getElementById('seconds');
const startButton = document.getElementById('start-btn');
const resetButton = document.getElementById('reset-btn');
const statusText = document.getElementById('status-text');
const suggestionsContainer = document.getElementById('suggestions-container');
const historyList = document.getElementById('history-list');
const container = document.querySelector('.app-container');
const timerProgressCircle = document.querySelector('.timer-progress-circle');
const settingsPanel = document.getElementById('settings-panel');
const settingsButton = document.getElementById('settings-btn');
const settingsCloseButton = document.getElementById('settings-close');
const shortcutButtons = document.querySelectorAll('.shortcut-btn');

// Sound test buttons
const testStartSound = document.getElementById('test-start-sound');
const testBreakSound = document.getElementById('test-break-sound');
const testCompleteSound = document.getElementById('test-complete-sound');

// Settings inputs
const pomodoroInput = document.getElementById('pomodoro-duration');
const shortBreakInput = document.getElementById('short-break-duration');
const longBreakInput = document.getElementById('long-break-duration');
const autoStartBreaksInput = document.getElementById('auto-start-breaks');
const autoStartPomodorosInput = document.getElementById('auto-start-pomodoros');
const showNotificationsInput = document.getElementById('show-notifications');
const playSoundsInput = document.getElementById('play-sounds');
const darkModeInput = document.getElementById('dark-mode');
const aiSuggestionsInput = document.getElementById('ai-suggestions');
const adaptiveTimingInput = document.getElementById('adaptive-timing');
const breakRecommendationsInput = document.getElementById('break-recommendations');

// Timer circle properties
const TIMER_CIRCLE_RADIUS = 90;
const TIMER_CIRCLE_CIRCUMFERENCE = 2 * Math.PI * TIMER_CIRCLE_RADIUS;

// Pomodoro Settings (default values, will be updated from storage)
let POMODORO_TIME = 25 * 60; // 25 minutes in seconds
let SHORT_BREAK_TIME = 5 * 60; // 5 minutes in seconds
let LONG_BREAK_TIME = 15 * 60; // 15 minutes in seconds
let POMODORO_CYCLES_BEFORE_LONG_BREAK = 4;
let AUTO_START_BREAKS = false;
let AUTO_START_POMODOROS = false;
let SHOW_NOTIFICATIONS = true;
let PLAY_SOUNDS = true;
let DARK_MODE = false;
let AI_SUGGESTIONS_ENABLED = true;
let ADAPTIVE_TIMING_ENABLED = false;
let BREAK_RECOMMENDATIONS_ENABLED = true;

// Adaptive timing constants
const MIN_POMODORO_DURATION = 10; // 10 minutes
const MAX_POMODORO_DURATION = 45; // 45 minutes
const ADAPTATION_SENSITIVITY = 0.3; // How quickly we adapt (0.1-1.0)

// Sound files
const startSound = new Audio(chrome.runtime.getURL('sounds/start.mp3'));
const breakSound = new Audio(chrome.runtime.getURL('sounds/break.mp3'));
const completeSound = new Audio(chrome.runtime.getURL('sounds/complete.mp3'));

// State
let timerRunning = false;
let currentTime = POMODORO_TIME;
let timerInterval = null;
let currentMode = 'pomodoro'; // 'pomodoro', 'shortBreak', 'longBreak'
let completedPomodoros = 0;
let initialTime = POMODORO_TIME; // To track progress for the circle
let sessionStartTime = null; // Track when the current session started

// Goals feature elements
const goalsList = document.getElementById('goals-list');
const toggleAddGoalButton = document.getElementById('toggle-add-goal');
const addGoalForm = document.getElementById('add-goal-form');
const addGoalInput = document.getElementById('add-goal-input');
const addGoalButton = document.getElementById('add-goal-btn');

// Insights panel elements
const insightsToggle = document.querySelector('.insights-toggle');
const insightsPanel = document.querySelector('.insights-panel');
const closeInsights = document.querySelector('.close-insights');
const productivityScoreElement = document.getElementById('productivity-score');
const optimalDurationElement = document.getElementById('optimal-duration');
const productivityChart = document.getElementById('productivity-chart');
const recommendationBox = document.getElementById('adaptive-recommendation');
const recommendationText = document.getElementById('recommendation-text');
const applyRecommendationBtn = document.getElementById('apply-recommendation');
const dismissRecommendationBtn = document.getElementById('dismiss-recommendation');

// Cached productivity data
let productivityData = {
  score: 0,
  optimalDuration: 0,
  hasRecommendation: false,
  recommendedDuration: 0,
  sessionCompletions: [],
  sessionInterruptions: []
};

// Break recommendation types
const BREAK_RECOMMENDATION_TYPES = {
  STRETCHING: 'stretching',
  BREATHING: 'breathing',
  HYDRATION: 'hydration',
  EYE_REST: 'eye_rest',
  WALK: 'walk',
  POSTURE: 'posture',
  MINDFULNESS: 'mindfulness'
};

// Break recommendation database
const BREAK_RECOMMENDATIONS = {
  [BREAK_RECOMMENDATION_TYPES.STRETCHING]: [
    {
      title: "Desk Stretches",
      description: "Simple stretches to relieve tension in your shoulders, neck, and back.",
      link: "https://www.youtube.com/watch?v=tAUf7aajBWE",
      duration: "3-5 min"
    },
    {
      title: "Wrist & Hand Stretches",
      description: "Relieve strain from typing with these gentle exercises.",
      link: "https://www.youtube.com/watch?v=kovhLVX4JQQ",
      duration: "2-3 min"
    },
    {
      title: "Full Body Stretch Routine",
      description: "A quick full-body stretch to boost circulation and energy.",
      link: "https://www.youtube.com/watch?v=sTxC3J3gQEU",
      duration: "5 min"
    }
  ],
  [BREAK_RECOMMENDATION_TYPES.BREATHING]: [
    {
      title: "Box Breathing Technique",
      description: "Calm your mind with this simple 4-4-4-4 breathing pattern.",
      link: "https://www.youtube.com/watch?v=tEmt1Znux58",
      duration: "2-3 min"
    },
    {
      title: "Stress Relief Breathing",
      description: "Deep breathing exercises to reduce cortisol levels.",
      link: "https://www.youtube.com/watch?v=Wemm-i6XHr8",
      duration: "3 min"
    },
    {
      title: "Energizing Breath",
      description: "Quick breathing technique to boost alertness and focus.",
      link: "https://www.youtube.com/watch?v=aXaCCK3MRiM",
      duration: "1 min"
    }
  ],
  [BREAK_RECOMMENDATION_TYPES.HYDRATION]: [
    {
      title: "Hydration Reminder",
      description: "Take a moment to drink some water for better cognitive function.",
      link: null,
      duration: "1 min"
    },
    {
      title: "Make Herbal Tea",
      description: "Prepare some calming herbal tea to stay hydrated and focused.",
      link: null,
      duration: "3-5 min"
    }
  ],
  [BREAK_RECOMMENDATION_TYPES.EYE_REST]: [
    {
      title: "20-20-20 Eye Rest",
      description: "Look at something 20 feet away for 20 seconds every 20 minutes.",
      link: "https://www.youtube.com/watch?v=_FrrNwQwRDo",
      duration: "1-2 min"
    },
    {
      title: "Eye Relaxation Exercises",
      description: "Simple exercises to reduce eye strain from screen time.",
      link: "https://www.youtube.com/watch?v=W10j2fL0hy0",
      duration: "2-3 min"
    }
  ],
  [BREAK_RECOMMENDATION_TYPES.WALK]: [
    {
      title: "Quick Walking Break",
      description: "Take a short walk to refresh your mind and body.",
      link: null,
      duration: "3-5 min"
    },
    {
      title: "Desk Area Walking",
      description: "Do a few laps around your work area to get your blood flowing.",
      link: null,
      duration: "2-3 min"
    }
  ],
  [BREAK_RECOMMENDATION_TYPES.POSTURE]: [
    {
      title: "Posture Reset",
      description: "Quick exercises to realign your posture after focused work.",
      link: "https://www.youtube.com/watch?v=RqcOCBb9e-I",
      duration: "2 min"
    },
    {
      title: "Desk Ergonomics Check",
      description: "Take a moment to adjust your workspace ergonomics.",
      link: "https://www.youtube.com/watch?v=Ree1CWifQTg",
      duration: "1-2 min"
    }
  ],
  [BREAK_RECOMMENDATION_TYPES.MINDFULNESS]: [
    {
      title: "Quick Mindfulness Meditation",
      description: "A short meditation to clear your mind and reduce stress.",
      link: "https://www.youtube.com/watch?v=inpok4MKVLM",
      duration: "3 min"
    },
    {
      title: "Gratitude Practice",
      description: "Take a moment to reflect on three things you're grateful for.",
      link: null,
      duration: "2 min"
    },
    {
      title: "Progressive Muscle Relaxation",
      description: "Release tension throughout your body with this guided technique.",
      link: "https://www.youtube.com/watch?v=1nZEdqcGVzo",
      duration: "5 min"
    }
  ]
};

// Session tracking data for break recommendations
let sessionData = {
  focusSessions: 0,
  longFocusSessions: 0,
  screenTime: 0,
  lastBreakActivity: null,
  breakActivitiesUsed: {},
  lastHydrationReminder: null,
  computerUseStartTime: Date.now(),
  sessionStartTime: null,
  keyboardMouseEvents: 0,
  lastPostureReminder: null
};

// Progress panel elements
const progressBtn = document.getElementById('progress-btn');
const progressPanel = document.getElementById('progress-panel');
const progressClose = document.getElementById('progress-close');
const dateRangeElement = document.getElementById('date-range');
const prevWeekBtn = document.getElementById('prev-week');
const nextWeekBtn = document.getElementById('next-week');
const totalPomodorosElement = document.getElementById('total-pomodoros');
const totalTimeElement = document.getElementById('total-time');
const avgRatingElement = document.getElementById('avg-rating');
const completionRateElement = document.getElementById('completion-rate');
const currentStreakElement = document.getElementById('current-streak');
const streakDaysElement = document.getElementById('streak-days');
const focusTimeChartElement = document.getElementById('focus-time-chart');
const productivityTimeChartElement = document.getElementById('productivity-time-chart');
const aiInsightsElement = document.getElementById('ai-insights');

// Task prioritization elements
const prioritizeTasksBtn = document.getElementById('prioritize-tasks');
const goalsContainer = document.querySelector('.goals-container');

// Priority levels
const PRIORITIES = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  UNSET: 'unset'
};

// Progress tracking state
let currentWeekStart = null;
let weeklyData = null;
let userWorkPatterns = {
  mostProductiveDay: null,
  mostProductiveTime: null,
  averageSessionDuration: 0,
  completionRate: 0,
  interruptions: [],
  streakDays: 0
};

// Initialize timer display
updateTimerDisplay();
updateCircleProgress(1); // Start with full circle

// Event Listeners
startButton.addEventListener('click', toggleTimer);
resetButton.addEventListener('click', resetTimer);
settingsButton.addEventListener('click', openSettings);
settingsCloseButton.addEventListener('click', closeSettings);
progressBtn.addEventListener('click', openProgressPanel);
progressClose.addEventListener('click', closeProgressPanel);
prevWeekBtn.addEventListener('click', () => navigateWeek(-1));
nextWeekBtn.addEventListener('click', () => navigateWeek(1));
prioritizeTasksBtn.addEventListener('click', prioritizeTasks);

// Shortcut buttons
shortcutButtons.forEach(button => {
  button.addEventListener('click', function() {
    if (timerRunning) return; // Don't allow changes when timer is running
    
    const time = parseInt(this.dataset.time);
    const type = this.dataset.type;
    
    // Update active button
    shortcutButtons.forEach(btn => btn.classList.remove('active'));
    this.classList.add('active');
    
    // Set timer based on type
    if (type === 'pomodoro') {
      currentMode = 'pomodoro';
      currentTime = POMODORO_TIME;
      initialTime = POMODORO_TIME;
      statusText.textContent = 'Ready to focus';
    } else if (type === 'shortBreak') {
      currentMode = 'shortBreak';
      currentTime = SHORT_BREAK_TIME;
      initialTime = SHORT_BREAK_TIME;
      statusText.textContent = 'Short break time';
    } else if (type === 'longBreak') {
      currentMode = 'longBreak';
      currentTime = LONG_BREAK_TIME;
      initialTime = LONG_BREAK_TIME;
      statusText.textContent = 'Long break time';
    }
    
    updateTimerDisplay();
    updateCircleProgress(1); // Reset circle progress
    updateUIForMode();
  });
});

// Sound test buttons
testStartSound.addEventListener('click', () => startSound.play().catch(err => console.log('Error playing sound:', err)));
testBreakSound.addEventListener('click', () => breakSound.play().catch(err => console.log('Error playing sound:', err)));
testCompleteSound.addEventListener('click', () => completeSound.play().catch(err => console.log('Error playing sound:', err)));

// Settings form inputs
pomodoroInput.addEventListener('change', updateSettings);
shortBreakInput.addEventListener('change', updateSettings);
longBreakInput.addEventListener('change', updateSettings);
autoStartBreaksInput.addEventListener('change', updateSettings);
autoStartPomodorosInput.addEventListener('change', updateSettings);
showNotificationsInput.addEventListener('change', updateSettings);
playSoundsInput.addEventListener('change', updateSettings);
darkModeInput.addEventListener('change', (e) => {
  updateSettings();
  document.body.classList.toggle('dark-mode', e.target.checked);
});
aiSuggestionsInput.addEventListener('change', updateSettings);
adaptiveTimingInput.addEventListener('change', updateSettings);
breakRecommendationsInput.addEventListener('change', updateSettings);

// Added event listeners for Goals feature
toggleAddGoalButton.addEventListener('click', toggleAddGoalForm);
addGoalButton.addEventListener('click', addGoal);
addGoalInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    addGoal();
  }
});

// Add event listeners for insights panel
insightsToggle.addEventListener('click', () => {
  insightsPanel.classList.add('active');
  loadProductivityData();
});

closeInsights.addEventListener('click', () => {
  insightsPanel.classList.remove('active');
});

// Apply recommended duration
applyRecommendationBtn.addEventListener('click', () => {
  if (productivityData.recommendedDuration) {
    // Convert minutes to seconds
    const newDuration = productivityData.recommendedDuration * 60;
    
    // Update the input field
    const pomodoroInput = document.getElementById('pomodoro-duration');
    pomodoroInput.value = productivityData.recommendedDuration;
    
    // Update global variable
    POMODORO_TIME = newDuration;
    
    // Update settings in storage
    updateSettings();
    
    // Reset timer with new duration
    resetTimer();
    
    // Hide recommendation
    recommendationBox.classList.remove('active');
    
    // Save that we've applied this recommendation
    chrome.storage.local.set({ lastAppliedRecommendation: Date.now() });
    
    // Show notification
    showNotification('Timer Updated', `Your focus duration has been updated to ${productivityData.recommendedDuration} minutes based on your productivity patterns.`);
  }
});

// Dismiss recommendation
dismissRecommendationBtn.addEventListener('click', () => {
  recommendationBox.classList.remove('active');
  
  // Remember that we've dismissed this recommendation for 48 hours
  chrome.storage.local.set({ 
    lastDismissedRecommendation: Date.now(),
    dismissedRecommendationValue: productivityData.recommendedDuration
  });
});

// Load saved data when popup opens
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  loadSessionHistory();
  loadGoals(); // Load saved goals
  
  // Initialize gamification
  if (window.gamification) {
    window.gamification.initializeBadgesPanel();
  }
  
  // Check if there's an active timer
  chrome.storage.local.get(['timerState'], (result) => {
    if (result.timerState) {
      const { endTime, mode, running, pomodorosCompleted } = result.timerState;
      
      if (running && endTime) {
        const now = new Date().getTime();
        const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
        
        if (remaining > 0) {
          currentTime = remaining;
          currentMode = mode;
          timerRunning = true;
          completedPomodoros = pomodorosCompleted || 0;
          
          // Set initialTime based on mode
          if (mode === 'pomodoro') {
            initialTime = POMODORO_TIME;
          } else if (mode === 'shortBreak') {
            initialTime = SHORT_BREAK_TIME;
          } else if (mode === 'longBreak') {
            initialTime = LONG_BREAK_TIME;
          }
          
          updateTimerDisplay();
          updateUIForMode();
          updateCircleProgress(currentTime / initialTime);
          startButton.innerHTML = '<i class="bi bi-pause"></i> Pause';
          
          startTimer();
        }
      }
    }
  });
  
  // If AI suggestions are enabled, get them
  if (AI_SUGGESTIONS_ENABLED) {
    getAISuggestions();
  } else {
    suggestionsContainer.innerHTML = '<p>AI suggestions are disabled. Enable them in settings.</p>';
  }
  
  // Check for insights after loading settings
  setTimeout(checkAndLoadInsights, 1000);
  
  // Simulate user activity (only for demo purposes - remove in real extension)
  setTimeout(() => {
    simulateUserActivity();
  }, 2000);
  
  // Load user activity data
  loadUserActivityData();
  
  // Initialize progress tracking
  initializeProgressTracking();
  
  // Add Badges button to header actions
  const actionsDiv = document.querySelector('.actions');
  const badgesButton = document.createElement('button');
  badgesButton.className = 'icon-btn tooltip';
  badgesButton.setAttribute('aria-label', 'Achievements');
  badgesButton.innerHTML = `
    <i class="bi bi-award"></i>
    <span class="tooltip-text">Achievements</span>
  `;
  actionsDiv.prepend(badgesButton);
  
  // Add event listener for badges button
  badgesButton.addEventListener('click', openBadgesPanel);
  
  // Add audio test button event listener
  const testAudioBtn = document.getElementById('test-audio-btn');
  if (testAudioBtn) {
    testAudioBtn.addEventListener('click', testAudioPlayback);
  }
});

// Save consecutive Pomodoros count on popup close
window.addEventListener('beforeunload', () => {
  chrome.storage.local.set({ 
    consecutivePomodoros: consecutivePomodoros,
    totalCompletedToday: totalCompletedToday
  });
});

// Create badges panel
function createBadgesPanel() {
  // Check if it already exists
  if (document.getElementById('badges-panel')) return;
  
  const badgesPanel = document.createElement('div');
  badgesPanel.id = 'badges-panel';
  badgesPanel.className = 'badges-panel';
  
  badgesPanel.innerHTML = `
    <div class="badges-header">
      <div class="badges-title">Achievements</div>
      <button class="badges-close" id="badges-close">×</button>
    </div>
    <div class="badges-content">
      <div class="badges-description">Earn badges by completing focus sessions and achieving various milestones.</div>
      <div class="badges-grid" id="badges-grid">
        <!-- Badges will be dynamically added here -->
      </div>
    </div>
  `;
  
  document.body.appendChild(badgesPanel);
  
  // Add event listener for close button
  const closeButton = document.getElementById('badges-close');
  closeButton.addEventListener('click', closeBadgesPanel);
  
  // Populate badges
  populateBadgesGrid();
}

function populateBadgesGrid() {
  // Use gamification.updateBadgesDisplay instead
  if (window.gamification && window.gamification.updateBadgesDisplay) {
    window.gamification.updateBadgesDisplay();
  }
}

function openBadgesPanel() {
  createBadgesPanel();
  
  // Show the panel with animation
  setTimeout(() => {
    const badgesPanel = document.getElementById('badges-panel');
    badgesPanel.classList.add('open');
  }, 10);
}

function closeBadgesPanel() {
  const badgesPanel = document.getElementById('badges-panel');
  if (badgesPanel) {
    badgesPanel.classList.remove('open');
    
    // Remove panel after animation completes
    setTimeout(() => {
      if (badgesPanel.parentNode) {
        badgesPanel.parentNode.removeChild(badgesPanel);
      }
    }, 300);
  }
}

// Functions
function loadSettings() {
  chrome.storage.local.get([
    'pomodoroTime',
    'shortBreakTime',
    'longBreakTime',
    'autoStartBreaks',
    'autoStartPomodoros',
    'showNotifications',
    'playSounds',
    'darkMode',
    'aiSuggestions',
    'adaptiveTiming',
    'breakRecommendations'
  ], (result) => {
    // Timer durations
    POMODORO_TIME = result.pomodoroTime || 25 * 60;
    SHORT_BREAK_TIME = result.shortBreakTime || 5 * 60;
    LONG_BREAK_TIME = result.longBreakTime || 15 * 60;
    
    // Update input fields
    pomodoroInput.value = POMODORO_TIME / 60;
    shortBreakInput.value = SHORT_BREAK_TIME / 60;
    longBreakInput.value = LONG_BREAK_TIME / 60;
    
    // Feature toggles
    AUTO_START_BREAKS = result.autoStartBreaks === true;
    AUTO_START_POMODOROS = result.autoStartPomodoros === true;
    SHOW_NOTIFICATIONS = result.showNotifications !== false; // Default to true
    PLAY_SOUNDS = result.playSounds !== false; // Default to true
    DARK_MODE = result.darkMode === true;
    AI_SUGGESTIONS_ENABLED = result.aiSuggestions !== false; // Default to true
    ADAPTIVE_TIMING_ENABLED = result.adaptiveTiming === true;
    BREAK_RECOMMENDATIONS_ENABLED = result.breakRecommendations !== false; // Default to true
    
    // Update checkboxes
    autoStartBreaksInput.checked = AUTO_START_BREAKS;
    autoStartPomodorosInput.checked = AUTO_START_POMODOROS;
    showNotificationsInput.checked = SHOW_NOTIFICATIONS;
    playSoundsInput.checked = PLAY_SOUNDS;
    darkModeInput.checked = DARK_MODE;
    aiSuggestionsInput.checked = AI_SUGGESTIONS_ENABLED;
    adaptiveTimingInput.checked = ADAPTIVE_TIMING_ENABLED;
    breakRecommendationsInput.checked = BREAK_RECOMMENDATIONS_ENABLED;
    
    // Apply dark mode if enabled
    if (DARK_MODE) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    
    // Update shortcut button text with the current time settings
    updateShortcutButtonText();
    
    // If AI suggestions are enabled, get them now
    if (AI_SUGGESTIONS_ENABLED) {
      getAISuggestions();
    } else {
      const suggestionsContainer = document.getElementById('suggestions-container');
      suggestionsContainer.innerHTML = '<p>AI suggestions are disabled. Enable them in settings.</p>';
    }
    
    // Check for insights after loading settings
    setTimeout(checkAndLoadInsights, 1000);
  });
}

function updateSettings() {
  // Get values from input fields
  const pomodoroTimeMinutes = Math.max(1, Math.min(60, parseInt(pomodoroInput.value) || 25));
  const shortBreakTimeMinutes = Math.max(1, Math.min(30, parseInt(shortBreakInput.value) || 5));
  const longBreakTimeMinutes = Math.max(5, Math.min(60, parseInt(longBreakInput.value) || 15));
  
  // Convert to seconds
  POMODORO_TIME = pomodoroTimeMinutes * 60;
  SHORT_BREAK_TIME = shortBreakTimeMinutes * 60;
  LONG_BREAK_TIME = longBreakTimeMinutes * 60;
  
  // Get checkbox values
  AUTO_START_BREAKS = autoStartBreaksInput.checked;
  AUTO_START_POMODOROS = autoStartPomodorosInput.checked;
  SHOW_NOTIFICATIONS = showNotificationsInput.checked;
  PLAY_SOUNDS = playSoundsInput.checked;
  DARK_MODE = darkModeInput.checked;
  AI_SUGGESTIONS_ENABLED = aiSuggestionsInput.checked;
  ADAPTIVE_TIMING_ENABLED = adaptiveTimingInput.checked;
  BREAK_RECOMMENDATIONS_ENABLED = breakRecommendationsInput.checked;
  
  // Save to storage
  chrome.storage.local.set({
    pomodoroTime: POMODORO_TIME,
    shortBreakTime: SHORT_BREAK_TIME,
    longBreakTime: LONG_BREAK_TIME,
    autoStartBreaks: AUTO_START_BREAKS,
    autoStartPomodoros: AUTO_START_POMODOROS,
    showNotifications: SHOW_NOTIFICATIONS,
    playSounds: PLAY_SOUNDS,
    darkMode: DARK_MODE,
    aiSuggestions: AI_SUGGESTIONS_ENABLED,
    adaptiveTiming: ADAPTIVE_TIMING_ENABLED,
    breakRecommendations: BREAK_RECOMMENDATIONS_ENABLED
  });
  
  // Apply dark mode
  if (DARK_MODE) {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
  
  // Update shortcut button text
  updateShortcutButtonText();
  
  // Reset timer if it's not running
  if (!timerRunning) {
    switch (currentMode) {
      case 'pomodoro':
        currentTime = POMODORO_TIME;
        initialTime = POMODORO_TIME;
        break;
      case 'shortBreak':
        currentTime = SHORT_BREAK_TIME;
        initialTime = SHORT_BREAK_TIME;
        break;
      case 'longBreak':
        currentTime = LONG_BREAK_TIME;
        initialTime = LONG_BREAK_TIME;
        break;
    }
    updateTimerDisplay();
    updateCircleProgress(1);
  }
  
  // Get AI suggestions if enabled, otherwise show disabled message
  if (AI_SUGGESTIONS_ENABLED) {
    getAISuggestions();
  } else {
    const suggestionsContainer = document.getElementById('suggestions-container');
    suggestionsContainer.innerHTML = '<p>AI suggestions are disabled. Enable them in settings.</p>';
  }
}

function updateShortcutButtonText() {
  const pomodoroButton = document.querySelector('.shortcut-btn[data-type="pomodoro"]');
  const shortBreakButton = document.querySelector('.shortcut-btn[data-type="shortBreak"]');
  const longBreakButton = document.querySelector('.shortcut-btn[data-type="longBreak"]');
  
  if (pomodoroButton) pomodoroButton.querySelector('.time').textContent = POMODORO_TIME / 60;
  if (shortBreakButton) shortBreakButton.querySelector('.time').textContent = SHORT_BREAK_TIME / 60;
  if (longBreakButton) longBreakButton.querySelector('.time').textContent = LONG_BREAK_TIME / 60;
}

function openSettings() {
  settingsPanel.classList.add('open');
}

function closeSettings() {
  settingsPanel.classList.remove('open');
}

function toggleTimer() {
  if (timerRunning) {
    pauseTimer();
    startButton.innerHTML = '<i class="bi bi-play-fill"></i> Resume';
  } else {
    startTimer();
    startButton.innerHTML = '<i class="bi bi-pause"></i> Pause';
    
    // Play start sound if we're starting a fresh Pomodoro and sounds are enabled
    if (currentMode === 'pomodoro' && currentTime === POMODORO_TIME && PLAY_SOUNDS) {
      startSound.play().catch(err => console.log('Error playing sound:', err));
    }
    
    // Record the session start time if this is a fresh Pomodoro
    if (currentMode === 'pomodoro' && currentTime === POMODORO_TIME) {
      sessionStartTime = new Date().getTime();
    }
  }
}

function startTimer() {
  timerRunning = true;
  
  // Calculate the end time and save it
  const now = new Date().getTime();
  const endTime = now + (currentTime * 1000);
  
  // Save timer state
  chrome.storage.local.set({
    timerState: {
      endTime,
      mode: currentMode,
      running: true,
      pomodorosCompleted: completedPomodoros
    }
  });
  
  // If we're starting a new Pomodoro session and AI suggestions are enabled, get them
  if (currentMode === 'pomodoro' && currentTime === POMODORO_TIME && AI_SUGGESTIONS_ENABLED) {
    getAISuggestions();
  }
  
  // Update status text
  if (currentMode === 'pomodoro') {
    statusText.textContent = 'Focus time! Stay on task.';
  } else {
    statusText.textContent = 'Break time! Relax your mind.';
  }
  
  // Add pulse animation to timer
  document.querySelector('.timer-circle').classList.add('pulse');
  
  // Start interval
  timerInterval = setInterval(() => {
    currentTime--;
    
    // Update the circle progress
    updateCircleProgress(currentTime / initialTime);
    
    if (currentTime <= 0) {
      handleTimerComplete();
    }
    
    updateTimerDisplay();
  }, 1000);
  
  // If this is a pomodoro session, update the session tracking data
  if (currentMode === 'pomodoro') {
    sessionData.sessionStartTime = Date.now();
    
    // Reset keyboard/mouse event counter for this session
    sessionData.keyboardMouseEvents = 0;
    
    // Start tracking activity if not already tracking
    if (!window.activityTrackingInterval) {
      window.activityTrackingInterval = setInterval(trackUserActivity, 60000); // Check every minute
    }
  }
}

function pauseTimer() {
  timerRunning = false;
  clearInterval(timerInterval);
  
  // Remove pulse animation
  document.querySelector('.timer-circle').classList.remove('pulse');
  
  // Update saved timer state
  chrome.storage.local.get(['timerState'], (result) => {
    if (result.timerState) {
      result.timerState.running = false;
      chrome.storage.local.set({ timerState: result.timerState });
    }
  });
  
  statusText.textContent = 'Timer paused';
}

function resetTimer() {
  // If this was a pomodoro in progress, record the interruption for adaptive timing
  if (timerRunning && currentMode === 'pomodoro' && ADAPTIVE_TIMING_ENABLED) {
    recordInterruption();
  }
  
  pauseTimer();
  
  // Reset to Pomodoro mode
  currentMode = 'pomodoro';
  currentTime = POMODORO_TIME;
  initialTime = POMODORO_TIME;
  sessionStartTime = null; // Reset the session start time
  
  // Reset consecutive Pomodoros on manual reset
  consecutivePomodoros = 0;
  
  // Update UI
  startButton.innerHTML = '<i class="bi bi-play-fill"></i> Start';
  statusText.textContent = 'Ready to focus';
  updateCircleProgress(1); // Reset circle progress
  
  // Update active shortcut button
  shortcutButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === 'pomodoro');
  });
  
  updateTimerDisplay();
  updateUIForMode();
  
  // Clear timer state
  chrome.storage.local.remove('timerState');
}

// When timer completes, check for achievements
function handleTimerComplete() {
  clearInterval(timerInterval);
  
  // Remove pulse animation
  document.querySelector('.timer-circle').classList.remove('pulse');
  
  // Play sound
  if (PLAY_SOUNDS) {
    completeSound.play().catch(err => console.log('Error playing sound:', err));
  }
  
  // Show notification
  if (SHOW_NOTIFICATIONS) {
    if (currentMode === 'pomodoro') {
      completedPomodoros++;
      saveSessionToHistory();
      saveSessionCompletionData();
      
      // Track consecutive and total completions for gamification
      consecutivePomodoros++;
      totalCompletedToday++;
      
      // Check for badges and rewards using gamification module
      if (window.gamification) {
        window.gamification.checkBadgeAchievements(completedPomodoros);
      }
      
      // Switch to break
      if (completedPomodoros % 4 === 0) {
        currentMode = 'longBreak';
        currentTime = LONG_BREAK_TIME;
        initialTime = LONG_BREAK_TIME;
        statusText.textContent = 'Long break';
      } else {
        currentMode = 'shortBreak';
        currentTime = SHORT_BREAK_TIME;
        initialTime = SHORT_BREAK_TIME;
        statusText.textContent = 'Short break';
      }
      
      // Show break recommendation after a completed pomodoro
      setTimeout(() => {
        showBreakRecommendation();
      }, 500);
    } else {
      // Break completed, switch back to pomodoro
      currentMode = 'pomodoro';
      currentTime = POMODORO_TIME;
      initialTime = POMODORO_TIME;
      statusText.textContent = 'Ready to focus';
    }
  }
  
  // Update UI
  updateTimerDisplay();
  updateCircleProgress(1);
  startButton.innerHTML = '<i class="bi bi-play-fill"></i> Start';
  updateUIForMode();
  
  // Auto-start next timer if enabled
  if ((currentMode === 'pomodoro' && AUTO_START_POMODOROS) ||
      ((currentMode === 'shortBreak' || currentMode === 'longBreak') && AUTO_START_BREAKS)) {
    setTimeout(() => {
      startTimer();
    }, 1500);
  }
  
  // Update active shortcut button
  shortcutButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === currentMode);
  });
}

function updateTimerDisplay() {
  const minutes = Math.floor(currentTime / 60);
  const seconds = currentTime % 60;
  
  minutesElement.textContent = minutes < 10 ? `0${minutes}` : minutes;
  secondsElement.textContent = seconds < 10 ? `0${seconds}` : seconds;
  
  // Update document title with timer
  document.title = `${minutes < 10 ? `0${minutes}` : minutes}:${seconds < 10 ? `0${seconds}` : seconds} - Pomodoro AI`;
}

function updateCircleProgress(percentage) {
  // Percentage should be between 0 and 1
  // When percentage is 1, the circle is full (no dash offset)
  // When percentage is 0, the circle is empty (full dash offset)
  const offset = TIMER_CIRCLE_CIRCUMFERENCE - (percentage * TIMER_CIRCLE_CIRCUMFERENCE);
  timerProgressCircle.style.strokeDasharray = TIMER_CIRCLE_CIRCUMFERENCE;
  timerProgressCircle.style.strokeDashoffset = offset;
}

function updateUIForMode() {
  // Remove all mode classes
  container.classList.remove('break-mode');
  
  // Add appropriate mode class
  if (currentMode === 'shortBreak' || currentMode === 'longBreak') {
    container.classList.add('break-mode');
  }
}

function saveSessionToHistory() {
  const now = new Date();
  const sessionData = {
    date: now.toLocaleDateString(),
    time: now.toLocaleTimeString(),
    type: 'Pomodoro Session',
    duration: `${POMODORO_TIME / 60} minutes`
  };
  
  chrome.storage.local.get(['sessionHistory'], (result) => {
    const history = result.sessionHistory || [];
    history.unshift(sessionData); // Add new session at the beginning
    
    // Keep only the last 10 entries
    if (history.length > 10) {
      history.length = 10;
    }
    
    chrome.storage.local.set({ sessionHistory: history }, () => {
      loadSessionHistory(); // Refresh the display
    });
  });
}

function loadSessionHistory() {
  chrome.storage.local.get(['sessionHistory'], (result) => {
    const history = result.sessionHistory || [];
    
    if (history.length === 0) {
      historyList.innerHTML = '<li class="history-item">No sessions yet</li>';
      return;
    }
    
    historyList.innerHTML = '';
    history.forEach(session => {
      const listItem = document.createElement('li');
      listItem.className = 'history-item';
      
      const sessionType = document.createElement('span');
      sessionType.textContent = `${session.type} (${session.duration})`;
      
      const sessionDate = document.createElement('span');
      sessionDate.className = 'history-date';
      sessionDate.textContent = `${session.date}, ${session.time}`;
      
      listItem.appendChild(sessionType);
      listItem.appendChild(sessionDate);
      
      historyList.appendChild(listItem);
    });
  });
}

// Update getAISuggestions function API endpoint
function getAISuggestions() {
  suggestionsContainer.innerHTML = `
    <div class="loading">
      <div class="dot-flashing"></div>
      <span>Loading AI tips</span>
    </div>
  `;
  
  // These are productivity tips that will be used if the API call fails
  const fallbackTips = [
    "Focus on one task at a time to maintain deep concentration.",
    "Keep a clear workspace to minimize distractions.",
    "Set specific goals for your Pomodoro session.",
    "Write down distracting thoughts to revisit later.",
    "Stay hydrated - drink water during your breaks.",
    "Proper posture improves focus and prevents fatigue.",
    "Use your breaks to move around and stretch.",
    "Consider the 2-minute rule: If it takes less than 2 minutes, do it now."
  ];
  
  // Call the Google AI API to get personalized productivity suggestions
  fetch('https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': API_KEY
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: "Give me 2-3 concise, practical productivity tips for a 25-minute Pomodoro work session. Format as bullet points without explanations. Keep each tip under 15 words."
        }]
      }]
    })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(data => {
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const aiContent = data.candidates[0].content.parts[0].text;
      
      // Apply fade-in animation
      suggestionsContainer.innerHTML = `<div class="animate__animated animate__fadeIn">${aiContent}</div>`;
    } else {
      throw new Error('Invalid API response format');
    }
  })
  .catch(error => {
    console.error('Error fetching AI suggestions:', error);
    
    // Use fallback tips instead
    const randomIndex = Math.floor(Math.random() * fallbackTips.length);
    suggestionsContainer.innerHTML = `
      <div class="animate__animated animate__fadeIn">
        <p>${fallbackTips[randomIndex]}</p>
      </div>
    `;
  });
}

// Goals functions
function toggleAddGoalForm() {
  const isHidden = addGoalForm.style.display === 'none';
  addGoalForm.style.display = isHidden ? 'flex' : 'none';
  if (isHidden) {
    addGoalInput.focus();
  }
}

function addGoal() {
  const goalText = addGoalInput.value.trim();
  
  if (goalText) {
    const newGoal = {
      id: Date.now().toString(),
      text: goalText,
      completed: false,
      createdAt: new Date().toISOString(),
      priority: PRIORITIES.UNSET
    };
    
    saveGoal(newGoal);
    addGoalInput.value = '';
    
    // Hide the form after adding
    toggleAddGoalForm();
  }
}

function saveGoal(goal) {
  chrome.storage.local.get(['goals'], (result) => {
    const goals = result.goals || [];
    goals.push(goal);
    
    chrome.storage.local.set({ goals }, () => {
      console.log('Goal saved');
      loadGoals(); // Refresh the goals list
    });
  });
}

function loadGoals() {
  chrome.storage.local.get(['goals'], (result) => {
    const goals = result.goals || [];
    
    if (goals.length === 0) {
      goalsList.innerHTML = '<div class="no-goals">No goals yet. Add one below!</div>';
      return;
    }
    
    // Sort goals: uncompleted first, then by date (newest first)
    goals.sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      return new Date(b.dateAdded) - new Date(a.dateAdded);
    });
    
    goalsList.innerHTML = '';
    goals.forEach(goal => {
      const goalElement = createGoalElement(goal);
      goalsList.appendChild(goalElement);
    });
  });
}

// Modified createGoalElement function to include priority indicators
function createGoalElement(goal) {
  const goalItem = document.createElement('div');
  goalItem.className = `goal-item${goal.completed ? ' goal-checked' : ''}`;
  goalItem.dataset.id = goal.id;
  
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'goal-checkbox';
  checkbox.checked = goal.completed;
  checkbox.addEventListener('change', () => toggleGoalCompletion(goal.id));
  
  const priorityIndicator = document.createElement('div');
  priorityIndicator.className = `priority-indicator priority-${goal.priority || 'unset'}`;
  priorityIndicator.textContent = getPriorityLabel(goal.priority);
  
  const goalText = document.createElement('div');
  goalText.className = 'goal-text';
  goalText.textContent = goal.text;
  
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'goal-delete';
  deleteBtn.innerHTML = '<i class="bi bi-x"></i>';
  deleteBtn.addEventListener('click', () => deleteGoal(goal.id));
  
  goalItem.appendChild(checkbox);
  goalItem.appendChild(priorityIndicator);
  goalItem.appendChild(goalText);
  goalItem.appendChild(deleteBtn);
  
  return goalItem;
}

function toggleGoalCompletion(goalId) {
  chrome.storage.local.get(['goals'], (result) => {
    const goals = result.goals || [];
    const goalIndex = goals.findIndex(g => g.id === goalId);
    
    if (goalIndex !== -1) {
      goals[goalIndex].completed = !goals[goalIndex].completed;
      
      chrome.storage.local.set({ goals }, () => {
        console.log('Goal completion toggled');
        loadGoals(); // Refresh the goals list
      });
    }
  });
}

function deleteGoal(goalId) {
  chrome.storage.local.get(['goals'], (result) => {
    const goals = result.goals || [];
    const updatedGoals = goals.filter(g => g.id !== goalId);
    
    chrome.storage.local.set({ goals: updatedGoals }, () => {
      console.log('Goal deleted');
      loadGoals(); // Refresh the goals list
    });
  });
}

// Adaptive Time Management Functions
function saveSessionCompletionData() {
  // Get the current timestamp and session data
  const completionTime = new Date().getTime();
  const sessionDuration = POMODORO_TIME / 60; // Duration in minutes
  
  // Calculate actual focus duration (from session start to now)
  let actualFocusTime = sessionDuration;
  if (sessionStartTime) {
    // Convert to minutes with one decimal place
    actualFocusTime = Math.round((completionTime - sessionStartTime) / 6000) / 10;
  }
  
  // Create session completion data
  const sessionData = {
    duration: sessionDuration,
    actualDuration: actualFocusTime,
    completionTime,
    interrupted: false, // Wasn't interrupted since it completed
    productivityRating: calculateProductivityRating(),
    timeOfDay: new Date().getHours()
  };
  
  // Save to storage
  chrome.storage.local.get(['sessionCompletions'], (result) => {
    const completions = result.sessionCompletions || [];
    completions.push(sessionData);
    
    // Keep only the last 30 sessions
    if (completions.length > 30) {
      completions.shift();
    }
    
    chrome.storage.local.set({ sessionCompletions: completions }, () => {
      console.log('Session completion data saved');
      analyzeWorkPatterns();
    });
  });
  
  // Track daily activity
  trackDailyActivity();
  
  // Reset session start time
  sessionStartTime = null;
}

function recordInterruption() {
  // Only record if we had a session start time
  if (!sessionStartTime) return;
  
  const interruptionTime = new Date().getTime();
  const sessionDuration = POMODORO_TIME / 60; // Duration in minutes
  
  // Calculate how long the session lasted before interruption
  const actualDuration = Math.round((interruptionTime - sessionStartTime) / 6000) / 10; // In minutes with one decimal
  
  // Only record if the session lasted at least 2 minutes
  if (actualDuration < 2) return;
  
  // If interrupted very late in the session (>90% completed), treat it like a completion
  const completionRatio = actualDuration / sessionDuration;
  
  if (completionRatio > 0.9) {
    // Treat as normal completion but with slightly lower productivity rating
    const sessionData = {
      duration: sessionDuration,
      actualDuration: actualDuration,
      completionTime: interruptionTime,
      interrupted: false, // Not technically interrupted, almost completed
      productivityRating: calculateProductivityRating() * 0.9, // Slightly penalized
      timeOfDay: new Date().getHours()
    };
    
    chrome.storage.local.get(['sessionCompletions'], (result) => {
      const completions = result.sessionCompletions || [];
      completions.push(sessionData);
      
      // Keep only the last 30 sessions
      if (completions.length > 30) {
        completions.shift();
      }
      
      chrome.storage.local.set({ sessionCompletions: completions }, () => {
        console.log('Near-complete session recorded');
      });
    });
  } else {
    // This is a genuine interruption
    const interruptionData = {
      duration: sessionDuration,
      actualDuration: actualDuration,
      interruptionTime: interruptionTime,
      interrupted: true,
      completionRatio: completionRatio,
      timeOfDay: new Date().getHours()
    };
    
    chrome.storage.local.get(['sessionInterruptions'], (result) => {
      const interruptions = result.sessionInterruptions || [];
      interruptions.push(interruptionData);
      
      // Keep only the last 15 interruptions
      if (interruptions.length > 15) {
        interruptions.shift();
      }
      
      chrome.storage.local.set({ sessionInterruptions: interruptions }, () => {
        console.log('Session interruption recorded');
        // If we have enough interruptions, analyze for patterns
        if (interruptions.length >= 3) {
          analyzeInterruptions();
        }
      });
    });
  }
}

function analyzeInterruptions() {
  if (!ADAPTIVE_TIMING_ENABLED) return;
  
  chrome.storage.local.get(['sessionInterruptions'], (result) => {
    const interruptions = result.sessionInterruptions || [];
    
    // Need at least 3 interruptions to make analysis
    if (interruptions.length < 3) return;
    
    // Calculate the average time before interruption
    let totalDuration = 0;
    let count = 0;
    
    interruptions.forEach(interruption => {
      totalDuration += interruption.actualDuration;
      count++;
    });
    
    const avgInterruptionTime = Math.round(totalDuration / count);
    
    // If the average interruption time is consistently less than current duration
    // and more than MIN_POMODORO_DURATION
    if (avgInterruptionTime >= MIN_POMODORO_DURATION && 
        avgInterruptionTime < (POMODORO_TIME / 60) - 3) {
      
      // Suggest a shorter duration based on when interruptions tend to happen
      suggestNewDuration(avgInterruptionTime);
    }
  });
}

function calculateProductivityRating() {
  // In a real implementation, this could be more sophisticated
  // For now, we'll use a simple algorithm based on time of day and random variation
  const hour = new Date().getHours();
  
  // Most people have higher productivity in the morning and after lunch
  let baseRating = 0.7; // Base productivity
  
  // Mornings (8 AM - 11 AM) tend to have higher productivity
  if (hour >= 8 && hour <= 11) {
    baseRating = 0.9;
  } 
  // Post-lunch dip (1 PM - 3 PM)
  else if (hour >= 13 && hour <= 15) {
    baseRating = 0.6;
  }
  // Late afternoon/evening (4 PM - 7 PM) moderate productivity
  else if (hour >= 16 && hour <= 19) {
    baseRating = 0.75;
  }
  // Late night (10 PM - 5 AM) variable productivity
  else if (hour >= 22 || hour <= 5) {
    baseRating = 0.65;
  }
  
  // Add some random variation (-0.1 to +0.1)
  const variation = (Math.random() * 0.2) - 0.1;
  
  // Ensure the rating is between 0 and 1
  return Math.min(Math.max(baseRating + variation, 0), 1);
}

function analyzeWorkPatterns() {
  if (!ADAPTIVE_TIMING_ENABLED) return;
  
  chrome.storage.local.get(['sessionCompletions', 'sessionInterruptions'], (result) => {
    const completions = result.sessionCompletions || [];
    const interruptions = result.sessionInterruptions || [];
    
    // Need at least 5 sessions to make meaningful adjustments
    if (completions.length < 5) return;
    
    // Define duration ranges for analysis
    const durationRanges = [
      { min: 15, max: 20, productivity: 0, count: 0, completionRate: 0 },
      { min: 21, max: 25, productivity: 0, count: 0, completionRate: 0 },
      { min: 26, max: 30, productivity: 0, count: 0, completionRate: 0 },
      { min: 31, max: 45, productivity: 0, count: 0, completionRate: 0 }
    ];
    
    // Calculate the most recent average productivity
    let recentAvgProductivity = 0;
    const recentSessions = completions.slice(-5);
    
    recentSessions.forEach(session => {
      recentAvgProductivity += session.productivityRating;
    });
    recentAvgProductivity /= recentSessions.length;
    
    // Group sessions into duration ranges and calculate completion rates
    const totalSessionsByDuration = {};
    
    // First count total sessions by duration
    completions.forEach(session => {
      const duration = session.duration;
      totalSessionsByDuration[duration] = (totalSessionsByDuration[duration] || 0) + 1;
    });
    
    interruptions.forEach(interruption => {
      const duration = interruption.duration;
      totalSessionsByDuration[duration] = (totalSessionsByDuration[duration] || 0) + 1;
    });
    
    // Now calculate stats for each range
    completions.forEach(session => {
      for (const range of durationRanges) {
        if (session.duration >= range.min && session.duration <= range.max) {
          range.productivity += session.productivityRating;
          range.count++;
          
          // Calculate completion rate
          const totalForDuration = totalSessionsByDuration[session.duration] || 0;
          if (totalForDuration > 0) {
            // How many times this duration was used successfully vs interrupted
            const completionRate = completions.filter(c => c.duration === session.duration).length / totalForDuration;
            range.completionRate += completionRate;
          }
          
          break;
        }
      }
    });
    
    // Calculate averages for each range
    durationRanges.forEach(range => {
      if (range.count > 0) {
        range.productivity /= range.count;
        range.completionRate /= range.count;
      }
    });
    
    // Score each range based on a weighted combination of productivity and completion rate
    durationRanges.forEach(range => {
      if (range.count > 0) {
        // Weight productivity at 70% and completion rate at 30%
        range.score = (range.productivity * 0.7) + (range.completionRate * 0.3);
      } else {
        range.score = 0;
      }
    });
    
    // Find the range with the highest score
    let bestRange = durationRanges[0];
    
    durationRanges.forEach(range => {
      if (range.count > 0 && range.score > bestRange.score) {
        bestRange = range;
      }
    });
    
    // Only suggest a change if we have data for this range
    if (bestRange.count > 0) {
      // Calculate the middle of the best range
      const optimalDuration = Math.round((bestRange.min + bestRange.max) / 2);
      const currentDuration = POMODORO_TIME / 60;
      
      // Only adjust if the optimal duration is different from current
      if (optimalDuration !== currentDuration) {
        // Calculate new duration with gradual adaptation
        const newDuration = Math.round(currentDuration + 
          ((optimalDuration - currentDuration) * ADAPTATION_SENSITIVITY));
        
        // Bound the new duration to allowed ranges
        const boundedDuration = Math.min(Math.max(newDuration, MIN_POMODORO_DURATION), MAX_POMODORO_DURATION);
        
        // Suggest the new duration if it's significantly different
        if (Math.abs(boundedDuration - currentDuration) >= 2) {
          suggestNewDuration(boundedDuration);
        }
      }
    }
  });
}

function suggestNewDuration(newDuration) {
  // Create notification
  chrome.notifications.create('', {
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: 'Adaptive Time Suggestion',
    message: `Based on your work patterns, a ${newDuration}-minute focus session might be more effective for you.`,
    priority: 2,
    buttons: [
      { title: 'Apply This Duration' },
      { title: 'No Thanks' }
    ]
  });
  
  // Store the suggested duration temporarily
  chrome.storage.local.set({ suggestedDuration: newDuration });
  
  // Listen for button clicks on the notification
  chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
    if (buttonIndex === 0) { // "Apply This Duration" button
      chrome.storage.local.get(['suggestedDuration'], (result) => {
        if (result.suggestedDuration) {
          // Update the pomodoro duration
          pomodoroInput.value = result.suggestedDuration;
          updateSettings();
          
          // Show confirmation
          chrome.notifications.create('', {
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: 'Duration Updated',
            message: `Your focus session duration is now ${result.suggestedDuration} minutes.`,
            priority: 1
          });
          
          // Clear the suggested duration
          chrome.storage.local.remove('suggestedDuration');
        }
      });
    } else {
      // Clear the suggested duration if declined
      chrome.storage.local.remove('suggestedDuration');
    }
  });
}

// Load productivity data from storage
function loadProductivityData() {
  chrome.storage.local.get([
    'sessionCompletions',
    'sessionInterruptions',
    'lastSuggestedDuration',
    'lastDismissedRecommendation',
    'dismissedRecommendationValue',
    'lastAppliedRecommendation'
  ], (result) => {
    const completions = result.sessionCompletions || [];
    const interruptions = result.sessionInterruptions || [];
    
    productivityData.sessionCompletions = completions;
    productivityData.sessionInterruptions = interruptions;
    
    // Check if we have enough data
    if (completions.length >= 3) {
      // Calculate productivity score from recent completions
      calculateProductivityMetrics(completions);
      
      // Check if there's a recommended duration
      const lastSuggestedDuration = result.lastSuggestedDuration;
      const lastDismissed = result.lastDismissedRecommendation;
      const dismissedValue = result.dismissedRecommendationValue;
      const lastApplied = result.lastAppliedRecommendation;
      
      // Only show recommendation if:
      // 1. We have a suggestion
      // 2. It hasn't been dismissed recently (within 48 hours)
      // 3. It hasn't been applied recently (within 24 hours)
      // 4. It's different from the current duration
      const now = Date.now();
      const dismissWindow = 48 * 60 * 60 * 1000; // 48 hours
      const appliedWindow = 24 * 60 * 60 * 1000; // 24 hours
      
      if (lastSuggestedDuration && 
          lastSuggestedDuration !== Math.round(POMODORO_TIME / 60) &&
          (!lastDismissed || now - lastDismissed > dismissWindow || dismissedValue !== lastSuggestedDuration) &&
          (!lastApplied || now - lastApplied > appliedWindow)) {
        
        productivityData.hasRecommendation = true;
        productivityData.recommendedDuration = lastSuggestedDuration;
        
        // Show recommendation
        recommendationText.textContent = `Based on your productivity patterns, a ${lastSuggestedDuration}-minute focus session might work better for you.`;
        recommendationBox.classList.add('active');
      }
    } else {
      // Not enough data yet
      productivityScoreElement.textContent = "N/A";
      optimalDurationElement.textContent = "N/A";
      
      // Clear chart
      productivityChart.innerHTML = '<div class="no-data" style="text-align:center;padding-top:40px;color:var(--text-secondary);font-size:12px;">Complete more sessions<br>to see insights</div>';
    }
    
    // Always render chart if we have any data
    if (completions.length > 0) {
      renderProductivityChart(completions);
    }
  });
}

// Calculate productivity metrics
function calculateProductivityMetrics(completions) {
  // Use only recent completions (last 10)
  const recentCompletions = completions.slice(-10);
  
  let totalProductivity = 0;
  
  recentCompletions.forEach(session => {
    totalProductivity += session.productivityRating;
  });
  
  // Calculate average productivity score
  const avgProductivity = totalProductivity / recentCompletions.length;
  productivityData.score = avgProductivity;
  
  // Format as percentage with no decimal places
  const scorePercent = Math.round(avgProductivity * 100);
  productivityScoreElement.textContent = `${scorePercent}%`;
  
  // Determine optimal duration
  let durationCounts = {};
  let durationProductivity = {};
  
  completions.forEach(session => {
    const duration = session.duration;
    durationCounts[duration] = (durationCounts[duration] || 0) + 1;
    durationProductivity[duration] = (durationProductivity[duration] || 0) + session.productivityRating;
  });
  
  // Calculate average productivity for each duration
  let bestDuration = 0;
  let bestScore = 0;
  
  Object.keys(durationCounts).forEach(duration => {
    const avg = durationProductivity[duration] / durationCounts[duration];
    // Only consider if we have at least 3 sessions with this duration
    if (durationCounts[duration] >= 3 && avg > bestScore) {
      bestScore = avg;
      bestDuration = parseInt(duration);
    }
  });
  
  if (bestDuration > 0) {
    productivityData.optimalDuration = bestDuration;
    optimalDurationElement.textContent = `${bestDuration}m`;
  } else {
    optimalDurationElement.textContent = `--`;
  }
}

// Render productivity chart
function renderProductivityChart(completions) {
  // Clear previous chart
  productivityChart.innerHTML = '';
  
  // Get completions for the last 7 days
  const now = new Date();
  const oneDay = 24 * 60 * 60 * 1000;
  const days = [];
  
  // Create array of the last 7 dates
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now.getTime() - (i * oneDay));
    days.push({
      date: date,
      day: date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0,1),
      completions: [],
      productivity: 0
    });
  }
  
  // Group completions by day
  completions.forEach(session => {
    const sessionDate = new Date(session.completionTime);
    
    for (let day of days) {
      if (sessionDate.toDateString() === day.date.toDateString()) {
        day.completions.push(session);
        break;
      }
    }
  });
  
  // Calculate productivity for each day
  days.forEach(day => {
    if (day.completions.length > 0) {
      let total = 0;
      day.completions.forEach(session => {
        total += session.productivityRating;
      });
      day.productivity = total / day.completions.length;
    }
  });
  
  // Render bars
  days.forEach((day, index) => {
    const barHeight = day.productivity * 80; // Scale to 80px max height
    const barLeft = 10 + (index * ((productivityChart.clientWidth - 20) / 7));
    
    // Create bar
    const bar = document.createElement('div');
    bar.className = 'chart-bar';
    bar.style.height = `${day.productivity > 0 ? barHeight : 2}px`;
    bar.style.left = `${barLeft}px`;
    bar.title = `${Math.round(day.productivity * 100)}% productivity on ${day.date.toLocaleDateString()}`;
    
    // Create label
    const label = document.createElement('div');
    label.className = 'chart-label';
    label.textContent = day.day;
    label.style.left = `${barLeft}px`;
    
    productivityChart.appendChild(bar);
    productivityChart.appendChild(label);
  });
}

// Load insights on startup if adaptive timing is enabled
function checkAndLoadInsights() {
  if (ADAPTIVE_TIMING_ENABLED) {
    // Check if there's a recommendation we should show
    chrome.storage.local.get([
      'lastSuggestedDuration',
      'lastDismissedRecommendation',
      'dismissedRecommendationValue',
      'lastAppliedRecommendation'
    ], (result) => {
      const lastSuggestedDuration = result.lastSuggestedDuration;
      const lastDismissed = result.lastDismissedRecommendation;
      const dismissedValue = result.dismissedRecommendationValue;
      const lastApplied = result.lastAppliedRecommendation;
      
      const now = Date.now();
      const dismissWindow = 48 * 60 * 60 * 1000; // 48 hours
      const appliedWindow = 24 * 60 * 60 * 1000; // 24 hours
      
      if (lastSuggestedDuration && 
          lastSuggestedDuration !== Math.round(POMODORO_TIME / 60) &&
          (!lastDismissed || now - lastDismissed > dismissWindow || dismissedValue !== lastSuggestedDuration) &&
          (!lastApplied || now - lastApplied > appliedWindow)) {
        
        // Show insights panel with recommendation
        insightsPanel.classList.add('active');
        loadProductivityData();
      }
    });
  }
}

// Track user activity to improve break recommendations
function trackUserActivity() {
  // Update screen time
  if (sessionData.sessionStartTime) {
    const now = Date.now();
    const elapsedMinutes = (now - sessionData.computerUseStartTime) / 60000;
    sessionData.screenTime += elapsedMinutes;
    
    // Reset the start time for next calculation
    sessionData.computerUseStartTime = now;
  }
  
  // Save accumulated data periodically
  saveUserActivityData();
}

// Save user activity data to storage
function saveUserActivityData() {
  chrome.storage.local.set({ userActivityData: sessionData });
}

// Load user activity data from storage
function loadUserActivityData() {
  chrome.storage.local.get(['userActivityData'], (result) => {
    if (result.userActivityData) {
      // Merge with default structure but preserve accumulated values
      sessionData = { ...sessionData, ...result.userActivityData };
    }
  });
}

// Mock function to simulate keyboard/mouse activity (in a real extension this would hook into actual events)
function simulateUserActivity() {
  sessionData.keyboardMouseEvents += 50 + Math.floor(Math.random() * 100);
  
  // In a real extension, you'd track actual keyboard and mouse events
  // document.addEventListener('keydown', () => { sessionData.keyboardMouseEvents++; });
  // document.addEventListener('mousemove', () => { sessionData.keyboardMouseEvents++; });
}

// Generate personalized break recommendations based on user patterns
function getPersonalizedBreakRecommendation() {
  let recommendationTypes = [];
  const now = Date.now();
  
  // Logic to determine what type of break is most needed
  
  // 1. Check if user has been sitting for multiple focus sessions (needs movement)
  if (sessionData.focusSessions >= 2) {
    recommendationTypes.push(BREAK_RECOMMENDATION_TYPES.STRETCHING);
    recommendationTypes.push(BREAK_RECOMMENDATION_TYPES.WALK);
  }
  
  // 2. Check if user has had intense keyboard/mouse activity (wrist/hand strain)
  if (sessionData.keyboardMouseEvents > 100) {
    recommendationTypes.push(BREAK_RECOMMENDATION_TYPES.STRETCHING);
  }
  
  // 3. Check for extended screen time (eye strain)
  if (sessionData.screenTime > 60) { // More than 60 minutes
    recommendationTypes.push(BREAK_RECOMMENDATION_TYPES.EYE_REST);
  }
  
  // 4. Check time since last hydration reminder
  const threeHoursMs = 3 * 60 * 60 * 1000;
  if (!sessionData.lastHydrationReminder || (now - sessionData.lastHydrationReminder > threeHoursMs)) {
    recommendationTypes.push(BREAK_RECOMMENDATION_TYPES.HYDRATION);
  }
  
  // 5. Check time since last posture reminder
  const twoHoursMs = 2 * 60 * 60 * 1000;
  if (!sessionData.lastPostureReminder || (now - sessionData.lastPostureReminder > twoHoursMs)) {
    recommendationTypes.push(BREAK_RECOMMENDATION_TYPES.POSTURE);
  }
  
  // 6. If we've had long focus sessions, suggest mindfulness
  if (sessionData.longFocusSessions >= 1) {
    recommendationTypes.push(BREAK_RECOMMENDATION_TYPES.MINDFULNESS);
    recommendationTypes.push(BREAK_RECOMMENDATION_TYPES.BREATHING);
  }
  
  // If no specific recommendations, add some defaults
  if (recommendationTypes.length === 0) {
    recommendationTypes = [
      BREAK_RECOMMENDATION_TYPES.BREATHING,
      BREAK_RECOMMENDATION_TYPES.STRETCHING,
      BREAK_RECOMMENDATION_TYPES.MINDFULNESS
    ];
  }
  
  // Prioritize less frequently used activities
  recommendationTypes.sort((a, b) => {
    const countA = sessionData.breakActivitiesUsed[a] || 0;
    const countB = sessionData.breakActivitiesUsed[b] || 0;
    return countA - countB;
  });
  
  // Get the highest priority recommendation type
  const recommendationType = recommendationTypes[0];
  
  // Update tracking data based on recommendation
  if (recommendationType === BREAK_RECOMMENDATION_TYPES.HYDRATION) {
    sessionData.lastHydrationReminder = now;
  } else if (recommendationType === BREAK_RECOMMENDATION_TYPES.POSTURE) {
    sessionData.lastPostureReminder = now;
  }
  
  // Track which break activity was recommended
  sessionData.lastBreakActivity = recommendationType;
  sessionData.breakActivitiesUsed[recommendationType] = 
    (sessionData.breakActivitiesUsed[recommendationType] || 0) + 1;
  
  // Save the updated tracking data
  saveUserActivityData();
  
  // Select a random recommendation of the chosen type
  const recommendations = BREAK_RECOMMENDATIONS[recommendationType];
  const randomIndex = Math.floor(Math.random() * recommendations.length);
  return recommendations[randomIndex];
}

// Display break recommendation in UI
function showBreakRecommendation() {
  // Only show on break modes and if break recommendations are enabled
  if (!BREAK_RECOMMENDATIONS_ENABLED || (currentMode !== 'shortBreak' && currentMode !== 'longBreak')) return;
  
  // Check if a recommendation is already showing
  const existingRecommendation = document.querySelector('.break-recommendation');
  if (existingRecommendation) {
    existingRecommendation.remove();
  }
  
  const recommendation = getPersonalizedBreakRecommendation();
  
  // Create the recommendation element
  const recommendationEl = document.createElement('div');
  recommendationEl.className = 'break-recommendation animate__animated animate__fadeIn';
  
  let recommendationHTML = `
    <div class="recommendation-header">
      <h3>Break Recommendation</h3>
      <div class="recommendation-time">${recommendation.duration}</div>
    </div>
    <div class="recommendation-title">${recommendation.title}</div>
    <div class="recommendation-description">${recommendation.description}</div>
  `;
  
  if (recommendation.link) {
    recommendationHTML += `
      <div class="recommendation-action">
        <a href="${recommendation.link}" target="_blank" rel="noopener noreferrer" class="recommendation-btn">
          <i class="bi bi-play-circle"></i> Start Now
        </a>
      </div>
    `;
  }
  
  recommendationEl.innerHTML = recommendationHTML;
  
  // Add to the main element
  const mainElement = document.querySelector('main');
  
  // Insert after the timer but before other elements
  const timerContainer = document.querySelector('.timer-container');
  mainElement.insertBefore(recommendationEl, timerContainer.nextSibling);
  
  // Increment focus session counters
  sessionData.focusSessions++;
  
  // If the session was long (more than 35 minutes), count it as a long session
  if (initialTime >= 35 * 60) {
    sessionData.longFocusSessions++;
  }
  
  // Save the updated data
  saveUserActivityData();
}

// Clear break recommendations when changing modes
function clearBreakRecommendations() {
  const existingRecommendation = document.querySelector('.break-recommendation');
  if (existingRecommendation) {
    existingRecommendation.remove();
  }
}

// Add clearBreakRecommendations to the shortcut button event listeners
shortcutButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const timeInMinutes = parseInt(btn.dataset.time);
    const type = btn.dataset.type;
    
    // Update the active state
    shortcutButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Update the timer
    currentMode = type;
    
    switch (type) {
      case 'pomodoro':
        currentTime = POMODORO_TIME;
        initialTime = POMODORO_TIME;
        break;
      case 'shortBreak':
        currentTime = SHORT_BREAK_TIME;
        initialTime = SHORT_BREAK_TIME;
        
        // Show break recommendation if switching to a break
        setTimeout(showBreakRecommendation, 300);
        break;
      case 'longBreak':
        currentTime = LONG_BREAK_TIME;
        initialTime = LONG_BREAK_TIME;
        
        // Show break recommendation if switching to a break
        setTimeout(showBreakRecommendation, 300);
        break;
    }
    
    // Clear any existing break recommendations if switching to pomodoro
    if (type === 'pomodoro') {
      clearBreakRecommendations();
    }
    
    updateTimerDisplay();
    updateCircleProgress(1);
    updateUIForMode();
    
    // Pause if running
    if (timerRunning) {
      pauseTimer();
      startButton.innerHTML = '<i class="bi bi-play-fill"></i> Start';
    }
    
    // Update status text
    switch (type) {
      case 'pomodoro':
        statusText.textContent = 'Ready to focus';
        break;
      case 'shortBreak':
        statusText.textContent = 'Short break';
        break;
      case 'longBreak':
        statusText.textContent = 'Long break';
        break;
    }
  });
});

// Open progress panel and load data
function openProgressPanel() {
  progressPanel.classList.add('open');
  document.body.style.overflow = 'hidden';
  loadProgressData();
}

// Close progress panel
function closeProgressPanel() {
  progressPanel.classList.remove('open');
  document.body.style.overflow = '';
}

// Initialize progress tracking by setting current week
function initializeProgressTracking() {
  // Set current week start to the most recent Sunday
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 for Sunday, 1 for Monday, etc.
  const diff = now.getDate() - dayOfWeek;
  
  // Set to beginning of the current week (Sunday)
  currentWeekStart = new Date(now.setDate(diff));
  currentWeekStart.setHours(0, 0, 0, 0);
}

// Navigate between weeks
function navigateWeek(direction) {
  // Calculate new week start date
  const newDate = new Date(currentWeekStart);
  newDate.setDate(newDate.getDate() + (direction * 7));
  currentWeekStart = newDate;
  
  // Update UI with new date range
  updateDateRangeDisplay();
  
  // Load data for the new week
  loadProgressData();
}

// Update date range display
function updateDateRangeDisplay() {
  const weekEnd = new Date(currentWeekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  
  const options = { month: 'short', day: 'numeric' };
  const startFormatted = currentWeekStart.toLocaleDateString('en-US', options);
  const endFormatted = weekEnd.toLocaleDateString('en-US', options);
  
  dateRangeElement.textContent = `${startFormatted} - ${endFormatted}, ${weekEnd.getFullYear()}`;
  
  // Disable next week button if it's the current week
  const now = new Date();
  const currentSunday = new Date(now);
  currentSunday.setDate(now.getDate() - now.getDay());
  currentSunday.setHours(0, 0, 0, 0);
  
  nextWeekBtn.disabled = currentWeekStart.getTime() >= currentSunday.getTime();
  nextWeekBtn.style.opacity = nextWeekBtn.disabled ? '0.5' : '1';
}

// Load progress data for the selected week
function loadProgressData() {
  // Show loading state
  showLoadingState();
  
  // Update date range display
  updateDateRangeDisplay();
  
  // Get all completed sessions from storage
  chrome.storage.local.get([
    'sessionCompletions', 
    'sessionInterruptions', 
    'dailyActivity'
  ], (result) => {
    const allSessions = result.sessionCompletions || [];
    const allInterruptions = result.sessionInterruptions || [];
    const dailyActivity = result.dailyActivity || {};
    
    // Filter data for the selected week
    weeklyData = {
      completions: filterDataForWeek(allSessions),
      interruptions: filterDataForWeek(allInterruptions),
      dailyActivity: filterDailyActivityForWeek(dailyActivity)
    };
    
    // Calculate metrics
    calculateWeeklyMetrics();
    
    // Render UI components
    renderWeeklySummary();
    renderDailyFocusChart();
    renderProductivityByTimeChart();
    calculateStreak(dailyActivity);
    generateAIInsights();
  });
}

// Filter session data for the selected week
function filterDataForWeek(sessions) {
  const weekEnd = new Date(currentWeekStart);
  weekEnd.setDate(weekEnd.getDate() + 7); // End of the week (exclusive)
  
  return sessions.filter(session => {
    const sessionDate = new Date(session.completionTime || session.interruptionTime);
    return sessionDate >= currentWeekStart && sessionDate < weekEnd;
  });
}

// Filter daily activity data for the selected week
function filterDailyActivityForWeek(dailyActivity) {
  const weekEnd = new Date(currentWeekStart);
  weekEnd.setDate(weekEnd.getDate() + 7); // End of the week (exclusive)
  
  const filteredActivity = {};
  
  for (const dateStr in dailyActivity) {
    const date = new Date(dateStr);
    if (date >= currentWeekStart && date < weekEnd) {
      filteredActivity[dateStr] = dailyActivity[dateStr];
    }
  }
  
  return filteredActivity;
}

// Calculate weekly metrics from filtered data
function calculateWeeklyMetrics() {
  const completions = weeklyData.completions;
  const interruptions = weeklyData.interruptions;
  
  // Calculate total completed pomodoros
  const totalPomodoros = completions.length;
  
  // Calculate total focus time (in hours)
  let totalFocusMinutes = 0;
  completions.forEach(session => {
    totalFocusMinutes += session.duration || 0;
  });
  const totalFocusHours = (totalFocusMinutes / 60).toFixed(1);
  
  // Calculate average productivity rating
  let totalProductivity = 0;
  completions.forEach(session => {
    totalProductivity += session.productivityRating || 0;
  });
  const avgProductivity = totalPomodoros > 0 ? totalProductivity / totalPomodoros : 0;
  
  // Calculate completion rate
  const totalSessions = totalPomodoros + interruptions.length;
  const completionRate = totalSessions > 0 ? (totalPomodoros / totalSessions) * 100 : 0;
  
  // Identify most productive day and time
  const productivityByDay = {};
  const productivityByHour = {};
  
  completions.forEach(session => {
    const date = new Date(session.completionTime);
    const day = date.getDay();
    const hour = date.getHours();
    
    // Aggregate by day
    if (!productivityByDay[day]) {
      productivityByDay[day] = { total: 0, count: 0 };
    }
    productivityByDay[day].total += session.productivityRating || 0;
    productivityByDay[day].count++;
    
    // Aggregate by hour
    if (!productivityByHour[hour]) {
      productivityByHour[hour] = { total: 0, count: 0 };
    }
    productivityByHour[hour].total += session.productivityRating || 0;
    productivityByHour[hour].count++;
  });
  
  // Find most productive day
  let maxDayProductivity = 0;
  let mostProductiveDay = null;
  
  for (const day in productivityByDay) {
    const avgDayProductivity = productivityByDay[day].total / productivityByDay[day].count;
    if (avgDayProductivity > maxDayProductivity) {
      maxDayProductivity = avgDayProductivity;
      mostProductiveDay = parseInt(day);
    }
  }
  
  // Find most productive time
  let maxHourProductivity = 0;
  let mostProductiveHour = null;
  
  for (const hour in productivityByHour) {
    const avgHourProductivity = productivityByHour[hour].total / productivityByHour[hour].count;
    if (avgHourProductivity > maxHourProductivity) {
      maxHourProductivity = avgHourProductivity;
      mostProductiveHour = parseInt(hour);
    }
  }
  
  // Store metrics in the user work patterns object
  userWorkPatterns = {
    totalPomodoros,
    totalFocusHours,
    avgProductivity,
    completionRate,
    mostProductiveDay,
    mostProductiveHour,
    productivityByDay,
    productivityByHour,
    completions,
    interruptions
  };
}

// Render weekly summary statistics
function renderWeeklySummary() {
  totalPomodorosElement.textContent = userWorkPatterns.totalPomodoros;
  totalTimeElement.textContent = `${userWorkPatterns.totalFocusHours}h`;
  avgRatingElement.textContent = `${Math.round(userWorkPatterns.avgProductivity * 100)}%`;
  completionRateElement.textContent = `${Math.round(userWorkPatterns.completionRate)}%`;
}

// Calculate and render the user's streak
function calculateStreak(dailyActivity) {
  // Convert dailyActivity object to sorted array of dates
  const activityDates = Object.keys(dailyActivity)
    .map(dateStr => new Date(dateStr))
    .sort((a, b) => a - b);
  
  if (activityDates.length === 0) {
    currentStreakElement.textContent = '0';
    renderStreakDays([]);
    return;
  }
  
  // Get today and yesterday
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Check if today or yesterday is in the activity dates
  const hasTodayActivity = activityDates.some(date => date.getTime() === today.getTime());
  const hasYesterdayActivity = activityDates.some(date => date.getTime() === yesterday.getTime());
  
  // If neither today nor yesterday has activity, streak is 0
  if (!hasTodayActivity && !hasYesterdayActivity) {
    currentStreakElement.textContent = '0';
    renderStreakDays([]);
    return;
  }
  
  // Calculate the streak
  let streak = 0;
  let currentDate = hasTodayActivity ? today : yesterday;
  
  while (true) {
    const dateString = currentDate.toISOString().split('T')[0];
    if (dailyActivity[dateString]) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  currentStreakElement.textContent = streak.toString();
  
  // Generate last 7 days for streak display
  const last7Days = [];
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() - i);
    const dateString = date.toISOString().split('T')[0];
    
    last7Days.push({
      date,
      active: !!dailyActivity[dateString],
      isToday: i === 0
    });
  }
  
  renderStreakDays(last7Days);
}

// Render streak days UI
function renderStreakDays(days) {
  streakDaysElement.innerHTML = '';
  
  days.forEach(day => {
    const dayElement = document.createElement('div');
    dayElement.className = 'streak-day';
    if (day.active) dayElement.classList.add('active');
    if (day.isToday) dayElement.classList.add('today');
    
    const tooltip = document.createElement('span');
    tooltip.className = 'streak-day-tooltip';
    
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    tooltip.textContent = day.date.toLocaleDateString('en-US', options);
    
    dayElement.appendChild(tooltip);
    streakDaysElement.appendChild(dayElement);
  });
}

// Render daily focus time chart
function renderDailyFocusChart() {
  focusTimeChartElement.innerHTML = '';
  
  // Add axes (already in HTML)
  const xAxis = document.createElement('div');
  xAxis.className = 'chart-axis chart-x-axis';
  
  const yAxis = document.createElement('div');
  yAxis.className = 'chart-axis chart-y-axis';
  
  focusTimeChartElement.appendChild(xAxis);
  focusTimeChartElement.appendChild(yAxis);
  
  // Prepare data: focus time by day of week
  const focusByDay = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
  
  userWorkPatterns.completions.forEach(session => {
    const date = new Date(session.completionTime);
    const day = date.getDay();
    focusByDay[day] += session.duration / 60; // Convert minutes to hours
  });
  
  // Find max value for scale
  const maxHours = Math.max(...focusByDay, 1); // At least 1 hour for scale
  
  // Plot bars and labels
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const chartWidth = focusTimeChartElement.clientWidth - 30; // Account for y-axis
  const barWidth = Math.min(30, (chartWidth / 7) - 10);
  
  days.forEach((day, index) => {
    const hours = focusByDay[index];
    const percentage = hours / maxHours;
    const barHeight = Math.max(percentage * 170, 2); // Max height 170px, min 2px
    
    // Create bar
    const bar = document.createElement('div');
    bar.className = 'chart-bar';
    bar.style.height = `${barHeight}px`;
    bar.style.left = `${30 + (index * (chartWidth / 7))}px`;
    bar.style.width = `${barWidth}px`;
    
    // Add tooltip with exact hours
    bar.title = `${hours.toFixed(1)} hours on ${getDayName(index)}`;
    
    // Create day label
    const label = document.createElement('div');
    label.className = 'day-label';
    label.textContent = day;
    label.style.left = `${30 + (index * (chartWidth / 7)) + (barWidth / 2)}px`;
    
    focusTimeChartElement.appendChild(bar);
    focusTimeChartElement.appendChild(label);
  });
  
  // Add hour markers on y-axis
  const hourMarkers = [0, maxHours/2, maxHours];
  
  hourMarkers.forEach((hours, index) => {
    const marker = document.createElement('div');
    marker.className = 'hour-label';
    marker.textContent = hours.toFixed(1);
    marker.style.bottom = `${index * (170 / 2)}px`;
    focusTimeChartElement.appendChild(marker);
  });
}

// Render productivity by time of day chart
function renderProductivityByTimeChart() {
  productivityTimeChartElement.innerHTML = '';
  
  // Add axes
  const xAxis = document.createElement('div');
  xAxis.className = 'chart-axis chart-x-axis';
  
  const yAxis = document.createElement('div');
  yAxis.className = 'chart-axis chart-y-axis';
  
  productivityTimeChartElement.appendChild(xAxis);
  productivityTimeChartElement.appendChild(yAxis);
  
  // Prepare data: average productivity by hour
  const productivityByHour = userWorkPatterns.productivityByHour || {};
  const hours = [];
  
  // Group hours into 4 time periods
  const timePeriods = [
    { name: 'Morning', hours: [5, 6, 7, 8, 9, 10, 11], productivity: 0, count: 0 },
    { name: 'Afternoon', hours: [12, 13, 14, 15, 16], productivity: 0, count: 0 },
    { name: 'Evening', hours: [17, 18, 19, 20, 21], productivity: 0, count: 0 },
    { name: 'Night', hours: [22, 23, 0, 1, 2, 3, 4], productivity: 0, count: 0 }
  ];
  
  // Aggregate productivity by time period
  for (const hour in productivityByHour) {
    const hourNum = parseInt(hour);
    const hourData = productivityByHour[hour];
    const avgProductivity = hourData.total / hourData.count;
    
    // Find which time period this hour belongs to
    for (const period of timePeriods) {
      if (period.hours.includes(hourNum)) {
        period.productivity += avgProductivity * hourData.count;
        period.count += hourData.count;
        break;
      }
    }
  }
  
  // Calculate average productivity for each period
  timePeriods.forEach(period => {
    if (period.count > 0) {
      period.avgProductivity = period.productivity / period.count;
    } else {
      period.avgProductivity = 0;
    }
  });
  
  // Plot bars and labels
  const chartWidth = productivityTimeChartElement.clientWidth - 30;
  const barWidth = Math.min(40, (chartWidth / 4) - 10);
  
  timePeriods.forEach((period, index) => {
    const productivity = period.avgProductivity;
    const percentage = productivity; // Already 0-1
    const barHeight = Math.max(percentage * 170, 2); // Max height 170px, min 2px
    
    // Create bar
    const bar = document.createElement('div');
    bar.className = 'chart-bar';
    bar.style.height = `${barHeight}px`;
    bar.style.left = `${30 + (index * (chartWidth / 4))}px`;
    bar.style.width = `${barWidth}px`;
    
    // Add tooltip with exact productivity
    bar.title = `${Math.round(productivity * 100)}% productivity during ${period.name}`;
    
    // Create time period label
    const label = document.createElement('div');
    label.className = 'day-label';
    label.textContent = period.name.substring(0, 1);
    label.style.left = `${30 + (index * (chartWidth / 4)) + (barWidth / 2)}px`;
    
    productivityTimeChartElement.appendChild(bar);
    productivityTimeChartElement.appendChild(label);
  });
  
  // Add percentage markers on y-axis
  const percentMarkers = [0, 50, 100];
  
  percentMarkers.forEach((percent, index) => {
    const marker = document.createElement('div');
    marker.className = 'hour-label';
    marker.textContent = `${percent}%`;
    marker.style.bottom = `${index * (170 / 2)}px`;
    productivityTimeChartElement.appendChild(marker);
  });
}

// Generate AI insights based on user data
function generateAIInsights() {
  aiInsightsElement.innerHTML = '';
  
  // Show the loading state
  aiInsightsElement.innerHTML = `
    <div class="loading-insights">
      <div class="dot-flashing"></div>
      <span>Analyzing your productivity data</span>
    </div>
  `;
  
  // Analyze the user's data to determine patterns
  let weeklyData = loadWeeklyData();
  
  // Calculate user productivity metrics from their data
  const userData = {
    mostProductiveDay: calculateMostProductiveDay(weeklyData),
    mostProductiveTime: calculateMostProductiveTime(weeklyData),
    completionRate: calculateCompletionRate(weeklyData),
    averageDuration: calculateAverageFocusDuration(weeklyData),
    totalSessions: calculateTotalSessions(weeklyData),
    interruptions: calculateInterruptions(weeklyData),
    streak: calculateCurrentStreak(weeklyData),
    daysActive: Object.keys(weeklyData.dailyActivity || {}).length
  };
  
  // Build prompt for AI
  const prompt = `
    As a productivity assistant, analyze this user's Pomodoro usage data and provide 3-5 personalized insights.
    Format each insight with a title and description, and suggest one actionable tip. 
    Use a friendly, encouraging tone. Keep each insight concise (max 2 sentences each).
    
    User data:
    - Most productive day: ${userData.mostProductiveDay}
    - Most productive time: ${userData.mostProductiveTime}
    - Session completion rate: ${userData.completionRate}%
    - Average focus duration: ${userData.averageDuration} minutes
    - Total completed sessions: ${userData.totalSessions}
    - Number of interruptions: ${userData.interruptions}
    - Current streak: ${userData.streak} days
    - Days active this week: ${userData.daysActive}
    
    Format each insight like this:
    {
      "icon": "bi-icon-name", // Use a Bootstrap icon name that matches the insight
      "title": "Short title",
      "description": "Concise description with actionable tip"
    }
    
    Return exactly 4 insights in a JSON array.
  `;
  
  // Call the Google AI API to get personalized insights
  fetch('https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': API_KEY
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(data => {
    try {
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const aiContent = data.candidates[0].content.parts[0].text;
        
        // Extract JSON from the response
        const jsonMatch = aiContent.match(/\[\s*\{.*\}\s*\]/s);
        
        if (jsonMatch) {
          // Parse the JSON
          const insights = JSON.parse(jsonMatch[0]);
          
          // Display insights
          aiInsightsElement.innerHTML = '';
          insights.forEach(insight => {
            // Validate icon to ensure it's a Bootstrap icon
            const iconClass = insight.icon.startsWith('bi-') ? insight.icon : 'bi-lightbulb';
            
            const insightElement = document.createElement('div');
            insightElement.className = 'insight-item';
            
            insightElement.innerHTML = `
              <div class="insight-icon">
                <i class="bi ${iconClass}"></i>
              </div>
              <div class="insight-content">
                <div class="insight-title">${insight.title}</div>
                <div class="insight-description">${insight.description}</div>
              </div>
            `;
            
            aiInsightsElement.appendChild(insightElement);
          });
        } else {
          // Fallback to rule-based insights if can't parse JSON
          renderRuleBasedInsights();
        }
      } else {
        throw new Error('Invalid API response format');
      }
    } catch (error) {
      console.error('Error processing AI insights:', error);
      // Fallback to rule-based insights
      renderRuleBasedInsights();
    }
  })
  .catch(error => {
    console.error('Error fetching AI insights:', error);
    // Fallback to rule-based insights
    renderRuleBasedInsights();
  });
}

// Fallback function to generate rule-based insights when AI fails
function renderRuleBasedInsights() {
  const insights = [];
  
  // Insight 1: Most productive day
  if (userWorkPatterns.mostProductiveDay !== null) {
    insights.push({
      icon: 'bi-calendar-check',
      title: `Your most productive day is ${getDayName(userWorkPatterns.mostProductiveDay)}`,
      description: `Your focus sessions on ${getDayName(userWorkPatterns.mostProductiveDay)} have an average productivity rating of ${Math.round(userWorkPatterns.productivityByDay[userWorkPatterns.mostProductiveDay].total / userWorkPatterns.productivityByDay[userWorkPatterns.mostProductiveDay].count * 100)}%.`
    });
  }
  
  // Insight 2: Most productive time
  if (userWorkPatterns.mostProductiveHour !== null) {
    insights.push({
      icon: 'bi-clock',
      title: `You're most productive during ${getTimeOfDay(userWorkPatterns.mostProductiveHour)}`,
      description: `Consider scheduling your most important tasks between ${userWorkPatterns.mostProductiveHour}:00 and ${userWorkPatterns.mostProductiveHour + 1}:00 for maximum productivity.`
    });
  }
  
  // Insight 3: Completion rate
  if (userWorkPatterns.completionRate < 70 && userWorkPatterns.interruptions.length > 3) {
    insights.push({
      icon: 'bi-exclamation-triangle',
      title: 'High interruption rate detected',
      description: `Your completion rate is ${Math.round(userWorkPatterns.completionRate)}%. Consider trying shorter focus sessions to reduce interruptions and increase your completion rate.`
    });
  } else if (userWorkPatterns.completionRate > 90) {
    insights.push({
      icon: 'bi-trophy',
      title: 'Excellent focus discipline',
      description: `Your completion rate of ${Math.round(userWorkPatterns.completionRate)}% shows strong focus discipline. Keep up the great work!`
    });
  }
  
  // Insight 4: Optimal session duration
  const sessionDurations = userWorkPatterns.completions.map(s => s.duration);
  const avgDuration = sessionDurations.reduce((sum, duration) => sum + duration, 0) / sessionDurations.length;
  
  if (sessionDurations.length > 5) {
    insights.push({
      icon: 'bi-hourglass-split',
      title: `Your optimal session length is around ${Math.round(avgDuration)} minutes`,
      description: `Based on your completion patterns, you work best with sessions of approximately ${Math.round(avgDuration)} minutes.`
    });
  }
  
  // Insight 5: Consistency
  const dayCount = Object.keys(weeklyData.dailyActivity).length;
  if (dayCount >= 5) {
    insights.push({
      icon: 'bi-calendar-heart',
      title: 'You have excellent consistency',
      description: `You've used the Pomodoro technique on ${dayCount} days this week. Consistent daily practice leads to better productivity habits.`
    });
  } else if (dayCount >= 3) {
    insights.push({
      icon: 'bi-calendar-check',
      title: 'Good weekly consistency',
      description: `You've used the Pomodoro technique on ${dayCount} days this week. Try to add one more day for even better results.`
    });
  }
  
  // Insight 6: Streak motivation
  const streak = parseInt(currentStreakElement.textContent);
  if (streak > 3) {
    insights.push({
      icon: 'bi-fire',
      title: `${streak}-day streak!`,
      description: `You're on a ${streak}-day productivity streak. Keep the momentum going!`
    });
  }
  
  // If we don't have many insights, add a general tip
  if (insights.length < 3) {
    insights.push({
      icon: 'bi-lightbulb',
      title: 'Productivity Tip',
      description: 'Taking regular breaks increases overall productivity. The Pomodoro technique helps maintain focus while preventing burnout.'
    });
  }
  
  // Render insights
  aiInsightsElement.innerHTML = '';
  insights.slice(0, 5).forEach(insight => {
    const insightElement = document.createElement('div');
    insightElement.className = 'insight-item';
    
    insightElement.innerHTML = `
      <div class="insight-icon">
        <i class="bi ${insight.icon}"></i>
      </div>
      <div class="insight-content">
        <div class="insight-title">${insight.title}</div>
        <div class="insight-description">${insight.description}</div>
      </div>
    `;
    
    aiInsightsElement.appendChild(insightElement);
  });
}

// Show loading state while data is being fetched
function showLoadingState() {
  totalPomodorosElement.textContent = '...';
  totalTimeElement.textContent = '...';
  avgRatingElement.textContent = '...';
  completionRateElement.textContent = '...';
  currentStreakElement.textContent = '...';
  
  // Clear charts and insights
  focusTimeChartElement.innerHTML = '';
  productivityTimeChartElement.innerHTML = '';
  aiInsightsElement.innerHTML = '';
  streakDaysElement.innerHTML = '';
}

// Helper function to get day name from day index
function getDayName(dayIndex) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayIndex];
}

// Helper function to get time of day description
function getTimeOfDay(hour) {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

// Track daily activity when completing a pomodoro
function trackDailyActivity() {
  const today = new Date();
  const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD format
  
  chrome.storage.local.get(['dailyActivity'], (result) => {
    const dailyActivity = result.dailyActivity || {};
    
    // If we already have an entry for today, increment it
    if (dailyActivity[dateString]) {
      dailyActivity[dateString] += 1;
    } else {
      dailyActivity[dateString] = 1;
    }
    
    chrome.storage.local.set({ dailyActivity });
  });
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  updateTimerDisplay();
  updateUIForMode();
  setupSoundOptions();
  loadGoals();
  
  // Check for insights after loading settings
  setTimeout(checkAndLoadInsights, 1000);
  
  // ... rest of initialization ...
});

// Get priority label for display
function getPriorityLabel(priority) {
  switch (priority) {
    case PRIORITIES.HIGH:
      return 'H';
    case PRIORITIES.MEDIUM:
      return 'M';
    case PRIORITIES.LOW:
      return 'L';
    default:
      return '';
  }
}

// Prioritize tasks using AI
function prioritizeTasks() {
  // Get uncompleted goals
  chrome.storage.local.get(['goals'], (result) => {
    const allGoals = result.goals || [];
    const uncompletedGoals = allGoals.filter(goal => !goal.completed);
    
    if (uncompletedGoals.length < 2) {
      alert('You need at least 2 incomplete tasks to prioritize.');
      return;
    }
    
    // Show prioritizing overlay
    showPrioritizingOverlay();
    
    // Get task texts
    const taskTexts = uncompletedGoals.map(goal => goal.text);
    
    // Call AI for prioritization
    analyzeTasks(taskTexts)
      .then(priorities => {
        // Apply priorities to tasks
        const updatedGoals = allGoals.map(goal => {
          const priorityInfo = priorities.find(p => p.task === goal.text);
          if (priorityInfo) {
            return { ...goal, priority: priorityInfo.priority };
          }
          return goal;
        });
        
        // Save priorities and refresh UI
        chrome.storage.local.set({ goals: updatedGoals }, () => {
          loadGoals();
          hidePrioritizingOverlay();
          
          // Show confirmation
          showPriorityConfirmation(priorities);
        });
      })
      .catch(error => {
        console.error('Error prioritizing tasks:', error);
        hidePrioritizingOverlay();
        alert('There was an error prioritizing your tasks. Please try again.');
      });
  });
}

// Analyze tasks using AI to determine priorities
async function analyzeTasks(tasks) {
  return new Promise((resolve, reject) => {
    // Show loading state while API is processing
    
    // Format tasks for the prompt
    const taskDescriptions = tasks.map(task => task.text);
    
    // Build a prompt for the AI to analyze tasks
    const prompt = `
      As a productivity assistant, prioritize the following tasks based on urgency and complexity.
      Analyze each task and determine if it's HIGH, MEDIUM, or LOW priority.
      
      Tasks to prioritize:
      ${taskDescriptions.map((task, index) => `${index + 1}. ${task}`).join('\n')}
      
      For each task, consider:
      - Urgency: Does it contain words like "urgent", "ASAP", "deadline", "today", "tomorrow", "soon" (High urgency)?
      - Complexity: Does it involve words like "analyze", "create", "develop", "research", "design" (High complexity)?
      
      Return your analysis as a JSON array with this format:
      [
        {
          "task": "The exact task text",
          "priority": "HIGH" or "MEDIUM" or "LOW",
          "explanation": "Brief explanation about why this priority was assigned"
        },
        ...
      ]
      
      Sort the results by priority (HIGH first, then MEDIUM, then LOW).
    `;
    
    // Call the Google AI API to prioritize tasks
    fetch('https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': API_KEY
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      try {
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
          const aiContent = data.candidates[0].content.parts[0].text;
          
          // Extract JSON from the response (it might be surrounded by markdown code blocks)
          const jsonMatch = aiContent.match(/\[\s*\{.*\}\s*\]/s);
          
          if (jsonMatch) {
            // Parse the JSON
            const priorities = JSON.parse(jsonMatch[0]);
            
            // Map the API priorities to our application's PRIORITIES object
            const mappedPriorities = priorities.map(item => {
              let priorityLevel = PRIORITIES.MEDIUM; // Default
              
              if (item.priority === "HIGH") {
                priorityLevel = PRIORITIES.HIGH;
              } else if (item.priority === "MEDIUM") {
                priorityLevel = PRIORITIES.MEDIUM;
              } else if (item.priority === "LOW") {
                priorityLevel = PRIORITIES.LOW;
              }
              
              return {
                task: item.task,
                priority: priorityLevel,
                explanation: item.explanation
              };
            });
            
            // Sort priorities - high first, then medium, then low
            mappedPriorities.sort((a, b) => {
              const priorityRank = {
                [PRIORITIES.HIGH]: 0,
                [PRIORITIES.MEDIUM]: 1,
                [PRIORITIES.LOW]: 2,
                [PRIORITIES.UNSET]: 3
              };
              
              return priorityRank[a.priority] - priorityRank[b.priority];
            });
            
            resolve(mappedPriorities);
          } else {
            // If we couldn't parse JSON, fall back to heuristic method
            console.error("Couldn't parse JSON from AI response, falling back to heuristics");
            resolve(prioritizeWithHeuristics(tasks));
          }
        } else {
          throw new Error('Invalid API response format');
        }
      } catch (error) {
        console.error('Error processing AI response:', error);
        // Fall back to heuristic method
        resolve(prioritizeWithHeuristics(tasks));
      }
    })
    .catch(error => {
      console.error('Error calling AI for task prioritization:', error);
      // Fall back to heuristic method if API call fails
      resolve(prioritizeWithHeuristics(tasks));
    });
  });
}

// Fallback function to prioritize tasks using heuristics when AI fails
function prioritizeWithHeuristics(tasks) {
  // Simple criteria - using keyword heuristics
  const priorities = tasks.map(task => {
    let priority = PRIORITIES.MEDIUM; // Default
    
    // Check for urgency keywords
    const urgencyKeywords = ['urgent', 'asap', 'immediately', 'deadline', 'due', 'today', 'tomorrow'];
    const isUrgent = urgencyKeywords.some(keyword => task.toLowerCase().includes(keyword));
    
    // Check for complexity keywords
    const complexityKeywords = ['complex', 'difficult', 'hard', 'challenging', 'analyze', 'review', 'research'];
    const isComplex = complexityKeywords.some(keyword => task.toLowerCase().includes(keyword));
    
    // Calculate priority based on urgency and complexity
    if (isUrgent && isComplex) {
      priority = PRIORITIES.HIGH; // Urgent and complex
    } else if (isUrgent) {
      priority = PRIORITIES.HIGH; // Urgent but not complex
    } else if (isComplex) {
      priority = PRIORITIES.MEDIUM; // Complex but not urgent
    } else {
      // Check for low priority keywords
      const lowPriorityKeywords = ['later', 'eventually', 'sometime', 'when possible', 'optional'];
      const isLowPriority = lowPriorityKeywords.some(keyword => task.toLowerCase().includes(keyword));
      
      if (isLowPriority) {
        priority = PRIORITIES.LOW;
      }
    }
    
    return {
      task: task,
      priority: priority,
      explanation: generateExplanation(isUrgent, isComplex)
    };
  });
  
  // Sort priorities - high first, then medium, then low
  priorities.sort((a, b) => {
    const priorityRank = {
      [PRIORITIES.HIGH]: 0,
      [PRIORITIES.MEDIUM]: 1,
      [PRIORITIES.LOW]: 2,
      [PRIORITIES.UNSET]: 3
    };
    
    return priorityRank[a.priority] - priorityRank[b.priority];
  });
  
  return priorities;
}

// Generate explanation for priority
function generateExplanation(isUrgent, isComplex) {
  if (isUrgent && isComplex) {
    return "This task is urgent and complex - prioritize it.";
  } else if (isUrgent) {
    return "This is an urgent task that should be completed soon.";
  } else if (isComplex) {
    return "This task requires focus due to its complexity.";
  } else {
    return "This is a standard task with normal priority.";
  }
}

// Show overlay while prioritizing
function showPrioritizingOverlay() {
  // Create overlay if it doesn't exist
  if (!document.querySelector('.prioritizing-overlay')) {
    const overlay = document.createElement('div');
    overlay.className = 'prioritizing-overlay';
    
    // Add spinner
    const spinner = document.createElement('div');
    spinner.className = 'dot-flashing prioritizing-spinner';
    
    // Add text
    const text = document.createElement('div');
    text.className = 'prioritizing-text';
    text.textContent = 'Analyzing tasks and setting priorities...';
    
    overlay.appendChild(spinner);
    overlay.appendChild(text);
    
    goalsContainer.classList.add('prioritizing');
    goalsContainer.appendChild(overlay);
  }
}

// Hide prioritizing overlay
function hidePrioritizingOverlay() {
  const overlay = document.querySelector('.prioritizing-overlay');
  if (overlay) {
    overlay.remove();
    goalsContainer.classList.remove('prioritizing');
  }
}

// Show confirmation dialog after prioritization
function showPriorityConfirmation(priorities) {
  // Create dialog if it doesn't exist
  if (!document.querySelector('.priority-dialog')) {
    const dialog = document.createElement('div');
    dialog.className = 'priority-dialog';
    
    // Add header
    const header = document.createElement('div');
    header.className = 'priority-dialog-header';
    
    const title = document.createElement('div');
    title.className = 'priority-dialog-title';
    title.textContent = 'Tasks Prioritized';
    
    const description = document.createElement('div');
    description.className = 'priority-dialog-description';
    description.textContent = 'Your tasks have been ranked based on urgency and complexity.';
    
    header.appendChild(title);
    header.appendChild(description);
    
    // Add task list
    const taskList = document.createElement('div');
    taskList.className = 'priority-dialog-tasks';
    
    // Only show top 3 highest priority tasks
    const topTasks = priorities.slice(0, 3);
    
    topTasks.forEach(task => {
      const taskItem = document.createElement('div');
      taskItem.className = 'priority-dialog-task';
      
      const priorityDot = document.createElement('span');
      priorityDot.className = `priority-indicator priority-${task.priority}`;
      priorityDot.textContent = getPriorityLabel(task.priority);
      priorityDot.style.marginRight = '8px';
      
      const taskText = document.createElement('span');
      taskText.textContent = task.task;
      taskText.style.fontSize = '0.9rem';
      
      taskItem.appendChild(priorityDot);
      taskItem.appendChild(taskText);
      taskItem.style.margin = '8px 0';
      taskItem.style.display = 'flex';
      taskItem.style.alignItems = 'center';
      
      taskList.appendChild(taskItem);
    });
    
    // Add buttons
    const buttons = document.createElement('div');
    buttons.className = 'priority-dialog-buttons';
    
    const confirmButton = document.createElement('button');
    confirmButton.className = 'priority-dialog-button priority-dialog-button-confirm';
    confirmButton.textContent = 'Got it';
    confirmButton.addEventListener('click', () => {
      dialog.remove();
    });
    
    buttons.appendChild(confirmButton);
    
    // Assemble dialog
    dialog.appendChild(header);
    dialog.appendChild(taskList);
    dialog.appendChild(buttons);
    
    // Add to body
    document.body.appendChild(dialog);
    
    // Auto close after 8 seconds
    setTimeout(() => {
      if (document.body.contains(dialog)) {
        dialog.remove();
      }
    }, 8000);
  }
}

// Setup sound options
function setupSoundOptions() {
  // Add any additional sound setup logic you want to execute when the popup loads
  console.log('Setting up sound options');
}

// Add CSS styles for prioritization UI components
document.addEventListener('DOMContentLoaded', () => {
  const style = document.createElement('style');
  style.textContent = `
    .prioritizing-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.85);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 10;
      border-radius: 8px;
    }
    
    .dark-mode .prioritizing-overlay {
      background: rgba(30, 30, 30, 0.85);
    }
    
    .prioritizing {
      position: relative;
    }
    
    .prioritizing-text {
      margin-top: 20px;
      font-size: 14px;
      color: var(--text-primary);
    }
    
    .prioritizing-spinner {
      margin-bottom: 10px;
    }
    
    .priority-dialog {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border-radius: 12px;
      padding: 24px;
      width: 85%;
      max-width: 320px;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
      z-index: 1000;
      animation: fadeIn 0.3s ease-out forwards;
    }
    
    .dark-mode .priority-dialog {
      background: #2c2c2c;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
    }
    
    .priority-dialog-header {
      margin-bottom: 16px;
    }
    
    .priority-dialog-title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 4px;
      color: var(--text-primary);
    }
    
    .priority-dialog-description {
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.4;
    }
    
    .priority-dialog-tasks {
      margin: 16px 0;
      max-height: 150px;
      overflow-y: auto;
    }
    
    .priority-dialog-buttons {
      display: flex;
      justify-content: flex-end;
      margin-top: 16px;
    }
    
    .priority-dialog-button {
      border: none;
      border-radius: 6px;
      padding: 8px 16px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    
    .priority-dialog-button-confirm {
      background-color: var(--color-primary);
      color: white;
    }
    
    .priority-dialog-button-confirm:hover {
      background-color: var(--color-primary-dark);
    }
    
    .dark-mode .priority-dialog-button-confirm {
      background-color: var(--color-primary-dark);
    }
    
    .dark-mode .priority-dialog-button-confirm:hover {
      background-color: var(--color-primary);
    }
    
    .priority-indicator {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      font-size: 11px;
      font-weight: 600;
      color: white;
    }
    
    .priority-high {
      background-color: #e53935;
    }
    
    .priority-medium {
      background-color: #fb8c00;
    }
    
    .priority-low {
      background-color: #43a047;
    }
    
    .priority-unset {
      background-color: #9e9e9e;
      color: rgba(255, 255, 255, 0.8);
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translate(-50%, -45%); }
      to { opacity: 1; transform: translate(-50%, -50%); }
    }
  `;
  
  document.head.appendChild(style);
});

// Gamification elements
const badgesBtn = document.getElementById('badges-btn');
const badgesPanel = document.getElementById('badges-panel');
const badgesClose = document.getElementById('badges-close');
const badgesGrid = document.getElementById('badges-grid');
const badgeNotificationTemplate = document.getElementById('badge-notification-template');
const rewardNotificationTemplate = document.getElementById('reward-notification-template');

// Use gamification.js functions
function loadGamificationData() {
  chrome.storage.local.get(['completedPomodoros'], function(result) {
    if (result.completedPomodoros !== undefined) {
      completedPomodoros = result.completedPomodoros;
    }
    // earnedBadges already loaded by gamification.js
    
    // Call updateBadgesDisplay after loading data
    if (window.gamification && window.gamification.updateBadgesDisplay) {
      window.gamification.updateBadgesDisplay();
    }
  });
}

// Delegate to gamification.js
function saveGamificationData() {
  chrome.storage.local.set({
    completedPomodoros: completedPomodoros
  });
  // earnedBadges already saved by gamification.js
}

// Use updateBadgesDisplay from gamification.js
function updateBadgesDisplay() {
  window.gamification.updateBadgesDisplay && window.gamification.updateBadgesDisplay();
}

// Use checkBadgeAchievements from gamification.js
function checkBadgeAchievements() {
  completedPomodoros++;
  window.gamification.checkBadgeAchievements && window.gamification.checkBadgeAchievements(completedPomodoros);
}

// Event listeners for badge panel
badgesBtn.addEventListener('click', () => {
  badgesPanel.classList.add('open');
});

badgesClose.addEventListener('click', () => {
  badgesPanel.classList.remove('open');
});

// Add a test audio function that can be called from the console
function testAudioPlayback() {
  console.log('Testing audio playback...');
  const statusEl = document.getElementById('audio-test-status');
  
  if (statusEl) {
    statusEl.textContent = 'Testing popup audio...';
    statusEl.style.color = '#FFA500'; // Orange for testing
  }
  
  // Test audio in popup context first
  try {
    const testStart = new Audio(chrome.runtime.getURL('sounds/start.mp3'));
    console.log('Start sound created successfully in popup');
    
    testStart.play()
      .then(() => {
        console.log('✓ Start sound played successfully in popup');
        if (statusEl) statusEl.textContent = 'Popup start sound: ✓';
        
        // Now test background audio
        if (statusEl) statusEl.textContent = 'Testing background audio...';
        
        // Send message to background script to test audio there
        chrome.runtime.sendMessage(
          { action: 'testBackgroundAudio' },
          (response) => {
            if (chrome.runtime.lastError) {
              console.error('Error testing background audio:', chrome.runtime.lastError);
              if (statusEl) {
                statusEl.textContent = 'Error communicating with background';
                statusEl.style.color = '#F44336'; // Red for error
              }
              return;
            }
            
            console.log('Background audio test response:', response);
            
            if (response && response.success) {
              if (statusEl) {
                statusEl.textContent = 'Popup: ✓ | Background: Using mocks';
                statusEl.style.color = '#4CAF50'; // Green for success
              }
            } else {
              if (statusEl) {
                statusEl.textContent = 'Popup: ✓ | Background: ✗';
                statusEl.style.color = '#FFA500'; // Orange for partial success
              }
            }
          }
        );
      })
      .catch(err => {
        console.error('✗ Error playing start sound in popup:', err);
        if (statusEl) {
          statusEl.textContent = 'Error playing sound in popup';
          statusEl.style.color = '#F44336'; // Red for error
        }
      });
    
    return 'Audio test started - check console for results';
  } catch (e) {
    console.error('Error during popup audio test:', e);
    if (statusEl) {
      statusEl.textContent = 'Audio test failed';
      statusEl.style.color = '#F44336'; // Red for error
    }
    return 'Audio test failed - see console for details';
  }
}

// Make it available globally for testing
window.testAudioPlayback = testAudioPlayback;