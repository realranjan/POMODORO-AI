# Notification Sounds for Pomodoro AI

This directory contains sound files used for notifications in the Pomodoro AI extension.

## Sound Files

1. **start.mp3**
   - Played when a new Pomodoro session starts
   - Gentle "tick" sound indicating the timer has started
   - Duration: ~1 second

2. **break.mp3**
   - Played when a Pomodoro session completes and a break begins
   - Cheerful chime indicating accomplishment
   - Duration: ~2 seconds

3. **complete.mp3**
   - Played when a break ends and it's time to start a new Pomodoro
   - Energetic alert sound to refocus attention
   - Duration: ~2 seconds

## Placeholder Files

The current sound files are placeholders. You can replace them with your own sound files, ensuring they have the same names. Good sound files should be:

- Short (1-3 seconds)
- Distinctive and recognizable
- Not jarring or unpleasant
- Different enough from each other to indicate different states

## Sources for Free Sound Files

You can find free sound files at these websites:

- [Freesound](https://freesound.org/) (requires attribution for some sounds)
- [SoundBible](https://soundbible.com/) (check licenses for each sound)
- [Pixabay](https://pixabay.com/sound-effects/) (generally free for commercial use)
- [ZapSplat](https://www.zapsplat.com/) (requires account, some sounds free)

## Usage in Code

The sound files are used in the extension's JavaScript code like this:

```javascript
// Example from background.js or popup.js
const startSound = new Audio(chrome.runtime.getURL('sounds/start.mp3'));
const breakSound = new Audio(chrome.runtime.getURL('sounds/break.mp3'));
const completeSound = new Audio(chrome.runtime.getURL('sounds/complete.mp3'));

// Play appropriate sound
startSound.play();   // When Pomodoro starts
breakSound.play();   // When break starts
completeSound.play(); // When break ends
``` 