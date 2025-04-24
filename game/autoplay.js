
// [V] watch game state
// [V] distance between player and dangers
// [V] dangers direction (closest one)
// [V] get the score
// [V] simulate key stroke
// [V] handle game keystroke lock
// [ ] handle master commands

var webSocketConnected = false
var autoplay_is_on = false
var webSocketInstance = null
var wrong_game_warning = true
var LAST_AI_BUTTON_COMMAND = {
  up: false,
  right: false,
  left: false,
  space: false,
}

const set_autoplay = (is_on) => {
  if (webSocketConnected) {
    autoplay_is_on = is_on
    if (autoplay_is_on) {
      $('#autoplay-container').addClass('true')
      for (k in KEY_STATUS) {
        KEY_STATUS[k] = false
      }
      console.log("sending ", {state: Game.FSM.state}, " to the server")
      webSocketInstance.send(JSON.stringify({
        state: Game.FSM.state,
      }))
    } else {
      $('#autoplay-container').removeClass('true')
      for (k in KEY_STATUS) {
        KEY_STATUS[k] = false
      }
    }
    $('#autoplay-status').html(autoplay_is_on ? 'true' : 'false')
  }
}

const onopen = (event) => {
  webSocketConnected = true
  $('#no-websocket').hide()
}

const onmessage = (event) => {
  try {
    const parsedData = JSON.parse(event.data)

    if (parsedData.msg === 'lock') {
      LOCK_KEYSTROKE = true
      $('#lock_is_on').show()
      return
    } else if (parsedData.msg === 'unlock') {
      LOCK_KEYSTROKE = false
      $('#lock_is_on').hide()
      return
    }

    if (parsedData.msg === 'who are you' || parsedData.msg === 'game change') {
      // TODO: restart game on "game change" master command
      // if (parsedData.msg === 'game change' && parsedData.subject !== 'asteroids') {
      //   console.error('Wrong game client for started neat instance:', parsedData.name)
      // }
      webSocketInstance.send(JSON.stringify({ msg: 'game', game: 'asteroids' }))
      return
    }

    if (autoplay_is_on) {
      // TODO: maybe change this
      if (parsedData.name !== 'asteroids') {
        if (wrong_game_warning) {
          console.error('Wrong game client for started neat instance:', parsedData.name)
          wrong_game_warning = false
        }
        return
      }

      // wrong_game_warning variable prevents from spamming the error
      wrong_game_warning = true

      // TODO: change this
      if (parsedData.msg == 'restart') {
        if (Game.FSM.state == 'waiting') {
          Game.FSM.state = 'start'
        } else {
          Game.FSM.start()
        }
      } else {
        // load what button ai is asking to press
        LAST_AI_BUTTON_COMMAND = {...parsedData}
        // DO NOT MODIFY!
        // IMPORTANT: simulate keystroke "collisions" on a real keyboard (so the simulation is close to what a human on a keyboard can do)
        ;(() => {
          if (!KEY_STATUS.up && !KEY_STATUS.left && !KEY_STATUS.right && !KEY_STATUS.space
            && parsedData.left && parsedData.up
            && (parsedData.right || parsedData.space)) {
            parsedData.up = false
            parsedData.left = false
            parsedData.right = false
            parsedData.space = false
            return
          }
          if (KEY_STATUS.up || parsedData.up) {
            if (KEY_STATUS.space || parsedData.space) parsedData.left = false
            if (KEY_STATUS.left ||parsedData.left) {
              parsedData.right = false
              parsedData.space = false
            }
            if (KEY_STATUS.right || parsedData.right) parsedData.left = false
          }
          if ((KEY_STATUS.left || parsedData.left)
            && (KEY_STATUS.right || parsedData.right)) {
            parsedData.up = false
          }
        })()

        KEY_STATUS = {...parsedData};
      }
    }

  } catch(e) {console.error(e)}
}

const removeWebSocketListeners = () => {
  $('#no-websocket').show()
  webSocketConnected = false

  set_autoplay(false)
  LOCK_KEYSTROKE = false
  $('#lock_is_on').hide()

  webSocketInstance.removeEventListener('open', onopen)
  webSocketInstance.removeEventListener('message', onmessage)
  webSocketInstance.removeEventListener('error', removeWebSocketListeners)
  webSocketInstance.removeEventListener('close', removeWebSocketListeners)

  webSocketInstance = null
  // automatic reconnection attempt
  // addWebSocketListeners()
}

const addWebSocketListeners = () => {
  if (webSocketInstance !== null) return

  const url = 'ws://localhost:'+WEBSOCKET_PORT
  console.log('trying to connect to websocket: '+url)
  webSocketInstance = new WebSocket(url)

  webSocketInstance.addEventListener('open', onopen)
  webSocketInstance.addEventListener('message', onmessage)
  webSocketInstance.addEventListener('error', removeWebSocketListeners)
  webSocketInstance.addEventListener('close', removeWebSocketListeners)
}

