import { WebSocketServer } from 'ws'
import xor from './clients/xor.js' 
import asteroids from './clients/asteroids.js'
import master_controller from './clients/master_controller.js'

const PORT = parseInt(process.argv[2]) || 3000

let wss
try {
  wss = new WebSocketServer({ port: PORT })
} catch (e) {
  console.error(e)
  exit(1)
}

console.log('Websocket running on port '+PORT)

const current_game = {
  status: 'not initialized',
  name: 'asteroids',
  game_order: null,
  client_connected: 0,
  generation_number: 0,
  best_fitness_score: 0,
  number_finished_game: 0,
  total_population: 0,
}

wss.on('connection', (ws) => {
  ws.not_initialized = true
  ws.id = null
  ws.game = null
  ws.is_master = false
  ws.last_order = null

  ws.send(JSON.stringify({ msg: 'who are you' }))

  ws.on('error', console.error)
  ws.on('close', () => {
    if (ws.game !== null && ws.game === current_game.name) {
      current_game.client_connected--
    }
  })

  ws.on('message', (data) => {
    const object = JSON.parse(data)

    if (ws.not_initialized) {
      if (object.msg === 'master') {
        ws.is_master = true
      } else if (object.msg === 'game') {
        ws.game = object.game
      }
      ws.not_initialized = false
    }
    if (object.msg === 'change game' && ws.game !== null && ws.game === current_game.name) {
      current_game.client_connected++
    }

    // TODO: maybe check if last computation has finished and if not skip the message
    if (ws.is_master === false) {
      // TODO: handle client order spread if current_game.game_order !== ws.last_order
      if (ws.game === current_game.name && current_game.name === 'xor') {
        xor(current_game, ws, object)
      } else if (ws.game === current_game.name && current_game.name === 'asteroids') {
        asteroids(current_game, ws, object)
      }
      return
    }

    master_controller(wss, current_game, ws, object)
  })
})
