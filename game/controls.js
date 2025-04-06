KEY_CODES = {
  32: 'space',
  37: 'left',
  38: 'up',
  39: 'right',
  40: 'down',
  65: 'a',
  66: 'b',
  68: 'd',
  70: 'f',
  71: 'g',
  72: 'h',
  77: 'm',
  78: 'n',
  80: 'p',
  85: 'u',
}

KEY_STATUS = { keyDown:false };
for (code in KEY_CODES) {
  KEY_STATUS[KEY_CODES[code]] = false;
}

$(window)

.keydown(function (e) {
  // autoplay bypass
  if (webSocketConnected && autoplay_is_on && e.keyCode >= 32 && e.keyCode <= 39) {
    e.preventDefault() 
    return
  }
  KEY_STATUS.keyDown = true;
  // console.log(e.keyCode)
  if (KEY_CODES[e.keyCode]) {
    e.preventDefault();
    KEY_STATUS[KEY_CODES[e.keyCode]] = true;
  }
})

.keyup(function (e) {
  // autoplay bypass
  if (webSocketConnected && autoplay_is_on && e.keyCode >= 32 && e.keyCode <= 39) {
    e.preventDefault()
    return
  }
  KEY_STATUS.keyDown = false;
  if (KEY_CODES[e.keyCode]) {
    e.preventDefault();
    KEY_STATUS[KEY_CODES[e.keyCode]] = false;
  }
});
