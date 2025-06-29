
import { WebSocketServer } from 'ws'
import { cpus } from 'os'

import xor from './clients/xor.js' 
import asteroids from './clients/asteroids.js'
import master_controller from './clients/master_controller.js'
import report_visualizer from './clients/report_visualizer.js'

import reporter from './libs/reporter.js'

const cpu_number = cpus().length

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
  generation_limit : -1,
  best_fitness_score: null,
  number_finished_game: null,
  population: null,
  available_individuals: {},
}

wss.on('connection', (ws) => {
  ws.not_initialized = true
  ws.id = null
  ws.game = null
  ws.is_master = false
  ws.last_order = null
  ws.assigned_individual_idx = null
  ws.client_connected = false

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
        } else if (object.msg === 'report_visualizer') {
          ws.report_visualizer = true
        }
        ws.not_initialized = false
      }

      if (!ws.is_master && object.msg === 'game') {
        if (ws.game !== null && ws.game === current_game.name) {
          if (!ws.client_connected) {
            ws.client_connected = true
            ws.id = current_game.ccid
            current_game.ccid++
            current_game.client_connected++
          }
        } else {
          ws.client_connected = false
          ws.id = -1
        }
      }

      //
      // Game clients & Report visualizers
      //
      // TODO: maybe check if last computation has finished and if not skip the message
      if (ws.is_master === false) {
        // TODO: handle client order spread if current_game.game_order !== ws.last_order
        if (ws.game === current_game.name && current_game.name === 'xor') {
          xor(current_game, ws, object)

        } else if (ws.game === current_game.name && current_game.name === 'asteroids') {
          asteroids(current_game, ws, object)

        // reporter controller
        } else if (ws.report_visualizer && ws.get_report) {
          report_visualizer(current_game, object)
        }

      } else {
        //
        // Master controller
        //
        master_controller(wss, current_game, ws, object)

        // Master controller wants to initialize new learning process
        if (current_game.status === 'init') {
          current_game.status = 'initialization'
          if (current_game.name === 'xor') {
            xor(current_game, null, null)
          } else if (current_game.name === 'asteroids') {
            asteroids(current_game, null, null)
          }
          current_game.status = 'ready'
        }
      }

    } catch (e) {
      if (e.message === 'severance') {
        current_game.status = 'severance'
      } else {
        console.error(e)
      }
    }
  })
})
