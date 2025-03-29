# Pomodoro AI Chrome Extension

A productivity-focused Chrome extension that combines the Pomodoro technique with AI-powered productivity tools using Google's Gemini API.

## Features

- Standard Pomodoro timer (25-minute work sessions, 5-minute short breaks, 15-minute long breaks)
- AI-powered productivity suggestions for each work session
- Intelligent task prioritization using Gemini AI
- Personalized productivity insights based on your usage patterns
- Gamification with achievements and rewards to boost motivation
- Session history tracking
- Browser notifications when sessions end
- Customizable themes and settings

## Installation

### Developer Mode (Loading Unpacked Extension)

1. Clone or download this repository to your local machine
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" using the toggle in the top-right corner
4. Click "Load unpacked" and select the `public` folder from this repository
5. The extension should now appear in your Chrome toolbar

### From Chrome Web Store (Coming Soon)

Once published, you'll be able to install directly from the Chrome Web Store.

## Usage

1. Click on the Pomodoro AI icon in your Chrome toolbar to open the popup
2. Click the "Start" button to begin a 25-minute Pomodoro session
3. Work on your task until the timer completes
4. A notification will appear when it's time for a break
5. After the break, start your next Pomodoro session

### Task Prioritization

1. Add multiple tasks in the Goals section
2. Click the prioritize icon (sort arrow)
3. AI will automatically analyze and prioritize your tasks
4. View the results with color-coded priority levels (High, Medium, Low)

### Gamification

- Complete Pomodoro sessions to earn achievement badges
- After every 5 completed Pomodoro cycles, receive a virtual reward suggestion
- Track your progress and streaks in the achievements panel

## AI Features

The extension leverages Google's Gemini v1 API with the gemini-1.5-flash model to provide:

1. **Personalized Productivity Tips**: Receive tailored suggestions to maximize your productivity during each Pomodoro session.

2. **Task Prioritization**: AI analyzes your tasks and determines their priority based on urgency and complexity, helping you focus on what matters most.

3. **Productivity Insights**: Get personalized insights about your productivity patterns, including your most productive days, completion rates, and suggestions for improvement.

## Privacy

Your data stays on your device. The only external communication is with the Google AI API to generate productivity suggestions and insights, and no personal data is shared with this API.

## Development

### Setup

```
npm install
```

### Build

```
npm run build
```

### Testing the Extension

Follow the "Developer Mode" installation instructions above, but select the `dist` folder after building.

## License

MIT 