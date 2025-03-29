# Pomodoro AI Chrome Extension

A productivity-focused Chrome extension that combines the Pomodoro technique with AI-powered productivity suggestions using Google's Gemini API.

## Features

- Standard Pomodoro timer (25-minute work sessions, 5-minute short breaks, 15-minute long breaks)
- AI-powered productivity suggestions for each work session
- Session history tracking
- Browser notifications when sessions end
- Customizable themes

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

## AI Features

The extension uses Google's Gemini API to provide personalized productivity suggestions for each Pomodoro session. These suggestions are designed to help you make the most of your 25-minute focused work periods.

## Privacy

Your data stays on your device. The only external communication is with the Google AI API to generate productivity suggestions, and no personal data is shared with this API.

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