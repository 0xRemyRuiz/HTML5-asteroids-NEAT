
// TODO: maybe add original sounds
SFX = {
  laser:     new Audio('game/39459__THE_bizniss__laser.wav'),
  explosion: new Audio('game/51467__smcameron__missile_explosion.wav')
};

// preload audio
for (var sfx in SFX) {
  (function () {
    var audio = SFX[sfx];
    audio.muted = true;
    audio.play();

    SFX[sfx] = function () {
      if (!this.muted) {
        // NOTE: original code doesn't seem to work unless we add the line below
        audio.play();
        if (audio.duration == 0) {
          // somehow dropped out
          // NOTE: original code doesn't seem to work with the line below uncommented
          // audio.load();
          audio.play();
        } else {
          audio.muted = false;
          audio.currentTime = 0;
        }
      }
      return audio;
    }
  })();
}
// pre-mute audio
SFX.muted = true;