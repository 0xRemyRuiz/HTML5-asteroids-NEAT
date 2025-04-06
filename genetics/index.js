import { WebSocketServer } from 'ws';

const PORT = parseInt(process.argv[2]) || 3000
const TEST_MODE = false
const wss = new WebSocketServer({ port: PORT })

console.log("Websocket running on port "+PORT)

const testPossibilities = [
  JSON.stringify({
    up: true,
    left: true,
    right: true,
    space: true,
  }),
  JSON.stringify({
    up: true,
    left: true,
    right: true,
    space: false,
  }),
  JSON.stringify({
    up: false,
    left: true,
    right: true,
    space: false,
  }),
  JSON.stringify({
    up: false,
    left: true,
    right: false,
    space: true,
  }),
  JSON.stringify({
    up: false,
    left: false,
    right: false,
    space: true,
  }),
]

wss.on('connection', (ws) => {
  // TODO: maybe ID the connection
  // let newConnection = true
  let roll = 0
  console.log('new connection made!')
  ws.on('error', console.error)

  ws.on('message', (data) => {
    // TODO: maybe check if last computation has finished and if not skip the message
    const object = JSON.parse(data)
    // TODO: maybe handle better the "new game thing"
    if (object.state == "end_game" || object.state == "waiting") {
      ws.send(JSON.stringify({
        msg: "restart",
      }))
    } else {
      if (TEST_MODE) {
        roll++
        if (roll > testPossibilities.length * 300) {
          roll = 0
        }
        const idx = Math.round(roll / 300)
        ws.send(testPossibilities[idx])
      } else {
        console.log(object)
      }
    }
  })
})
