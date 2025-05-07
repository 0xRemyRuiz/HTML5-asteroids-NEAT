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
  ccid: 0,
  name: null,
  game_order: null,
  client_connected: 0,
  generation_number: null,
  best_fitness_score: null,
  number_finished_game: null,
  population: [],
  pop_idx: 0,
  available_individuals: {},
}

wss.on('connection', (ws) => {
  ws.not_initialized = true
  ws.id = null
  ws.game = null
  ws.is_master = false
  ws.last_order = null
  ws.assigned_individual_idx = null

  ws.send(JSON.stringify({ msg: 'who are you' }))

  ws.on('error', console.error)
  ws.on('close', () => {
    if (ws.game !== null && ws.game === current_game.name) {
      if (ws.assigned_individual_idx !== null) {
        current_game.available_individuals[ws.id] = ws.assigned_individual_idx
      }
      current_game.client_connected--
    }
  })

  ws.on('message', (data) => {
    try {

      const object = JSON.parse(data)

      if (ws.not_initialized) {
        if (object.msg === 'master') {
          ws.is_master = true
        } else if (object.msg === 'game') {
          ws.game = object.game
          // TODO: hook in new client with the same game id
          // lock + start new game with next NN in queue
        }
        ws.not_initialized = false
      }

      if (!ws.is_master && object.msg === 'game') {
        if (ws.game !== null && ws.game === current_game.name) {
          ws.id = current_game.ccid
          current_game.ccid++
          current_game.client_connected++
        } else {
          ws.id = -1
        }
      }

      //
      // Game clients
      //
      // TODO: maybe check if last computation has finished and if not skip the message
      if (ws.is_master === false) {
        // TODO: handle client order spread if current_game.game_order !== ws.last_order
        if (ws.game === current_game.name && current_game.name === 'xor') {
          xor(current_game, ws, object)
        } else if (ws.game === current_game.name && current_game.name === 'asteroids') {
          asteroids(current_game, ws, object)
        }

      } else {
        //
        // Master controller
        //
        master_controller(wss, current_game, ws, object)

        // Master controller wants to initialize new learning process
        if (current_game.status === 'init') {
          if (current_game.name === 'xor') {
            xor(current_game, null, null)
          } else if (current_game.name === 'asteroids') {
            asteroids(current_game, null, null)
          }
          current_game.status = 'ready'
        }
      }

    } catch (e) {}
  })
})
