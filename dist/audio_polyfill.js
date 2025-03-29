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

// Make sure window is defined
if (typeof window === 'undefined') {
  var window = {};
} 