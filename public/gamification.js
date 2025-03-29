// Gamification Module for Pomodoro AI Extension

// Badge definitions
const BADGES = [
  {
    id: 'first_pomodoro',
    name: 'First Focus',
    description: 'Completed your first Pomodoro',
    icon: 'bi-play-circle',
    color: '#4CAF50',
    requirement: 1
  },
  {
    id: 'five_pomodoros',
    name: 'Focus Streak',
    description: 'Completed 5 Pomodoros',
    icon: 'bi-lightning',
    color: '#FF9800',
    requirement: 5
  },
  {
    id: 'ten_pomodoros',
    name: 'Productivity Master',
    description: 'Completed 10 Pomodoros',
    icon: 'bi-trophy',
    color: '#9C27B0',
    requirement: 10
  },
  {
    id: 'twenty_five_pomodoros',
    name: 'Time Wizard',
    description: 'Completed 25 Pomodoros',
    icon: 'bi-clock-history',
    color: '#2196F3',
    requirement: 25
  }
];

// Reward activities
const REWARDS = [
  {
    name: 'Take a walk outside',
    description: 'Step outside for 5 minutes of fresh air and movement'
  },
  {
    name: 'Stretch break',
    description: 'Do some quick stretches to refresh your body'
  },
  {
    name: 'Hydration moment',
    description: 'Enjoy a glass of water or your favorite tea'
  },
  {
    name: 'Deep breathing',
    description: 'Take 10 deep breaths to clear your mind'
  },
  {
    name: 'Quick meditation',
    description: 'Close your eyes for a 2-minute mindfulness moment'
  },
  {
    name: 'Listen to a song',
    description: 'Enjoy one of your favorite songs as a quick mental break'
  },
  {
    name: 'Doodle time',
    description: 'Spend 2 minutes doodling or drawing something simple'
  },
  {
    name: 'Posture check',
    description: 'Reset your posture and do a quick shoulder roll'
  }
];

// Variables to track user progress
let earnedBadges = [];

// Load gamification data
function loadGamificationData() {
  chrome.storage.local.get(['earnedBadges'], function(result) {
    if (result.earnedBadges) {
      earnedBadges = result.earnedBadges;
    }
    updateBadgesDisplay();
  });
}

// Save gamification data
function saveGamificationData() {
  chrome.storage.local.set({
    earnedBadges: earnedBadges
  });
}

// Initialize badges display
function updateBadgesDisplay() {
  const badgesGrid = document.getElementById('badges-grid');
  if (!badgesGrid) return;
  
  badgesGrid.innerHTML = '';
  
  BADGES.forEach(badge => {
    const isEarned = earnedBadges.includes(badge.id);
    const badgeElement = document.createElement('div');
    badgeElement.className = `badge-item ${isEarned ? 'earned' : 'locked'}`;
    
    badgeElement.innerHTML = `
      <div class="badge-icon" style="background-color: ${isEarned ? badge.color + '30' : '#e0e0e0'}">
        <i class="bi ${badge.icon}" style="color: ${isEarned ? badge.color : '#999'}"></i>
      </div>
      <div class="badge-info">
        <div class="badge-name">${badge.name}</div>
        <div class="badge-description">${badge.description}</div>
      </div>
    `;
    
    badgesGrid.appendChild(badgeElement);
  });
}

// Check for badge achievements when a Pomodoro is completed
function checkBadgeAchievements(completedPomodoros) {
  // Check if any new badges have been earned
  BADGES.forEach(badge => {
    if (completedPomodoros >= badge.requirement && !earnedBadges.includes(badge.id)) {
      earnBadge(badge);
    }
  });
  
  // Check if we should offer a reward (every 5 Pomodoros)
  if (completedPomodoros % 5 === 0) {
    offerReward();
  }
  
  saveGamificationData();
}

// Display badge earned notification
function earnBadge(badge) {
  earnedBadges.push(badge.id);
  
  const badgeNotificationTemplate = document.getElementById('badge-notification-template');
  const notificationClone = badgeNotificationTemplate.content.cloneNode(true);
  const notification = notificationClone.querySelector('.badge-notification');
  
  // Set badge details
  notification.querySelector('.badge-icon i').className = `bi ${badge.icon}`;
  notification.querySelector('.badge-icon').style.backgroundColor = badge.color + '30';
  notification.querySelector('.badge-icon i').style.color = badge.color;
  notification.querySelector('.badge-name').textContent = badge.name;
  
  // Add close functionality
  notification.querySelector('.badge-close').addEventListener('click', () => {
    document.body.removeChild(notification);
  });
  
  // Auto-remove after 5 seconds
  document.body.appendChild(notification);
  setTimeout(() => {
    if (document.body.contains(notification)) {
      document.body.removeChild(notification);
    }
  }, 5000);
  
  updateBadgesDisplay();
}

// Offer a reward after milestone Pomodoros
function offerReward() {
  // Select a random reward
  const reward = REWARDS[Math.floor(Math.random() * REWARDS.length)];
  
  const rewardNotificationTemplate = document.getElementById('reward-notification-template');
  const notificationClone = rewardNotificationTemplate.content.cloneNode(true);
  const notification = notificationClone.querySelector('.reward-notification');
  
  // Set reward details
  notification.querySelector('.reward-name').textContent = reward.name;
  notification.querySelector('.reward-description').textContent = reward.description;
  
  // Add close functionality
  notification.querySelector('.reward-close').addEventListener('click', () => {
    document.body.removeChild(notification);
  });
  
  // Add claim functionality
  notification.querySelector('.reward-button').addEventListener('click', () => {
    document.body.removeChild(notification);
    showConfirmation('Enjoy your reward!');
  });
  
  document.body.appendChild(notification);
}

// Show a confirmation toast message
function showConfirmation(message) {
  const toast = document.createElement('div');
  toast.className = 'confirmation-toast';
  toast.textContent = message;
  
  document.body.appendChild(toast);
  setTimeout(() => {
    document.body.removeChild(toast);
  }, 3000);
}

// Initialize badges panel
function initializeBadgesPanel() {
  const badgesBtn = document.getElementById('badges-btn');
  const badgesPanel = document.getElementById('badges-panel');
  const badgesClose = document.getElementById('badges-close');
  
  if (badgesBtn && badgesPanel && badgesClose) {
    // Event listeners for badge panel
    badgesBtn.addEventListener('click', () => {
      badgesPanel.classList.add('open');
    });
    
    badgesClose.addEventListener('click', () => {
      badgesPanel.classList.remove('open');
    });
  }
  
  // Load gamification data on startup
  loadGamificationData();
}

// Export functions to be used in popup.js
window.gamification = {
  checkBadgeAchievements,
  offerReward,
  initializeBadgesPanel
};
