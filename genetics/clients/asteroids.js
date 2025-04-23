
const TEST_MODE = true

const testPossibilities = [
  JSON.stringify({
    name: 'asteroids',
    up: true,
    left: true,
    right: true,
    space: true,
  }),
  JSON.stringify({
    name: 'asteroids',
    up: true,
    left: true,
    right: true,
    space: false,
  }),
  JSON.stringify({
    name: 'asteroids',
    up: false,
    left: true,
    right: true,
    space: false,
  }),
  JSON.stringify({
    name: 'asteroids',
    up: false,
    left: true,
    right: false,
    space: true,
  }),
  JSON.stringify({
    name: 'asteroids',
    up: false,
    left: false,
    right: false,
    space: true,
  }),
]

let roll = 0

export default (current_game, ws, object) => {
  // TODO: maybe handle better the "new game thing"
  if (object.state == 'end_game' || object.state == 'waiting') {
    ws.send(JSON.stringify({
      name: 'asteroids',
      msg: 'restart',
    }))
  } else {
    if (TEST_MODE) {
      roll++
      if (roll > testPossibilities.length * 300) {
        roll = 0
      }
      const idx = Math.floor(roll / 300)
      ws.send(testPossibilities[idx])
    } else {
      console.log(object)
    }
  }
}
