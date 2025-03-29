# Pomodoro AI Chrome Extension

An AI-powered Pomodoro timer Chrome extension that helps you maximize productivity using the Pomodoro Technique, enhanced with artificial intelligence.

## Features

- **AI-Powered Productivity**: Leverages Google's Gemini API for intelligent task prioritization and personalized productivity insights
- **Pomodoro Timer**: Classic 25/5/15 minute cycle with customizable durations
- **Task Management**: Add, complete, and organize your tasks
- **Task Prioritization**: AI analyzes and prioritizes your tasks based on urgency and complexity
- **Progress Tracking**: Visualize your productivity and focus time with charts and statistics
- **Gamification**: Earn badges and rewards as you complete Pomodoro sessions to stay motivated
- **Personalized Insights**: Get AI-generated insights based on your productivity patterns
- **Break Recommendations**: Smart suggestions for how to spend your break time
- **Adaptive Timing**: Optional feature that learns your optimal work periods
- **Dark Mode**: Easy on the eyes during evening work sessions

## Installation

### From Chrome Web Store (Coming Soon)
1. Visit the Chrome Web Store (link to be added)
2. Click "Add to Chrome"
3. Follow the prompts to complete installation

### Manual Installation (Developer Mode)
1. Clone this repository:
```
git clone https://github.com/yourusername/pomodoro-ai.git
```
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top-right corner
4. Click "Load unpacked"
5. Select the `public` folder from this repository
6. The extension should now be installed and visible in your toolbar

## Usage

1. Click on the Pomodoro AI icon in your Chrome toolbar
2. Add tasks you want to accomplish
3. Start the Pomodoro timer
4. Work on your tasks until the timer completes
5. Take a short break
6. After 4 Pomodoros, take a longer break
7. View your progress and insights in the Progress panel
8. Earn badges and rewards as you complete sessions

## Development

Requirements:
- Node.js and npm

Setup:
```
npm install
```

Build:
```
npm run build
```

Create extension zip:
```
npm run zip
```

Clean build files:
```
npm run clean
```

## API Configuration

The extension uses Google's Gemini API for AI features. 

To use your own API key:
1. Get an API key from [Google AI Studio](https://makersuite.google.com/)
2. Open `public/popup.js` 
3. Update the `API_KEY` constant with your key

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- The Pomodoro Technique was developed by Francesco Cirillo
- Uses Google's Gemini API for artificial intelligence features
- Icons from Bootstrap Icons collection 