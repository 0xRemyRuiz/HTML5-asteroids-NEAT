
LOCK_KEYSTROKE = false

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
  75: 'k',
  77: 'm',
  80: 'p',
  84: 't',
  85: 'u',
}

KEY_STATUS = { keyDown: false }
for (code in KEY_CODES) {
  KEY_STATUS[KEY_CODES[code]] = false
}

const handle_strokes = (e) => {
  // autoplay and lock bypass
  if (webSocketConnected && (autoplay_is_on || LOCK_KEYSTROKE) && e.keyCode >= 32 && e.keyCode <= 39) {
    e.preventDefault()
    return true
  }
  return false
}

$(window)
.keydown(function (e) {
  if (!handle_strokes(e)) {
    KEY_STATUS.keyDown = true
    if (KEY_CODES[e.keyCode]) {
      e.preventDefault()
      KEY_STATUS[KEY_CODES[e.keyCode]] = true
    }
  }
})
.keyup(function (e) {
  resize_network_canva()
  KEY_STATUS.keyDown = false
  if (KEY_CODES[e.keyCode]) {
    e.preventDefault()
    KEY_STATUS[KEY_CODES[e.keyCode]] = false
  }
})
