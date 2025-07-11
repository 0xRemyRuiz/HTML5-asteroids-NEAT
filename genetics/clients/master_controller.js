
import prng from '../libs/prng.js'

export default (wss, current_game, ws, object) => {
  // Puppet Master Commander
  if (object.command) {
    let response = '', code = ''
    if (object.command === 'list') {
      response = '<p style="margin: 0">Command list</p>'
      response += '<ul style="margin: 0; display: inline-block">'

      response += '<li>set_seed <i>"seed"</i></li>'
      response += '<li>get_seed</li>'
      response += '<li>change <i>"game name"</i></li>'

      response += '</ul><ul style="margin: 0; display: inline-block">'

      response += '<li>init</li>'
      response += '<li>run</li>'
      response += '<li>stop</li>'

      response += '</ul><ul style="margin: 0; display: inline-block">'

      response += '<li>set_generation_limit <i>"generation limit"</i></li>'

      response += '</ul>'
      code = 'info'

    } else if (object.command === 'set_seed') {
      const seed = parseInt(object.subject)
      if (!isNaN(seed) && seed > 1 && seed < 4294967296) {
        prng.set_seed(seed)
        response = 'new seed = '+seed
        code = 'info'

      } else {
        response = 'ERROR: seed must be a number in interval [1; 4294967295]'
        code = 'error'
      }

    } else if (object.command === 'get_seed') {
        response = 'Current seed is '+prng.seed
        code = 'info'      

    } else if (object.command === 'change') {
      if (object.subject !== 'xor' && object.subject !== 'asteroids') {
        response = '<p style="margin: 0">Cannot change game to '+object.subject+'</p>'
        response += '<p style="margin: 0">Available games are: "xor", "asteroids"</p>'
        code = 'info'

      } else {
        current_game.status = 'game is set'
        current_game.name = object.subject
        current_game.ccid = 0
        current_game.client_connected = 0
        current_game.generation_number = null
        current_game.number_finished_game = null
        wss.clients.forEach((client) => {
          client.send(JSON.stringify({ msg: 'game change', subject: current_game.name }))
        })
        response = 'Current game is set to '+current_game.name
        code = 'info'
      }

    } else if (object.command === 'lock') {
      wss.clients.forEach((client) => {
        if (!object.subject || parseInt(object.subject) == client.id) {
          client.send(JSON.stringify({msg: 'lock'}))
        }
      })

    } else if (object.command === 'unlock') {
      wss.clients.forEach((client) => {
        if (!object.subject || parseInt(object.subject) == client.id) {
          client.send(JSON.stringify({msg: 'unlock'}))
        }
      })

    } else if (object.command === 'init') {
      if (current_game.name === null) {
        response = 'ERROR: command init failed, no game chosen'
        code = 'error'

      } else {
        prng.set_seed(prng.seed)
        current_game.status = 'init'
        response = 'Initialization processed'
        code = 'info'
      }

    } else if (object.command === 'run') {
      if (current_game.status === 'run') {
        response = 'game is already running'
        code = 'info'

      } else {
        if (current_game.status !== 'ready') {
          response = 'ERROR: command run failed, you need to "init" after a "change [game]"'
          code = 'error'
        }
        current_game.status = 'running'
        wss.clients.forEach((client) => {
          client.send(JSON.stringify({ msg: 'start' }))
        })
      }

    } else if (object.command === 'stop') {
      if (current_game.status === 'running') {
        current_game.status = 'ready'
        response = 'training paused'
        code = 'info'
      }

    } else if (object.command === 'sgl' || object.command === 'set_generation_limit') {
      const generation_limit = parseInt(object.subject)
      if (!isNaN(generation_limit)) {
        current_game.generation_limit = generation_limit
        response = 'new generation_limit = '+generation_limit
        code = 'info'

      } else {
        response = 'ERROR: generation_limit must be a number'
        code = 'error'
      }

    } else {
      response = 'ERROR: command not found, type "list" to get the command list'
      code = 'error'
    }

    ws.send(JSON.stringify({response, code}))
  }

  // stagger answers to master controller to save computational speed for games (clients)
  (async () => {
    await (() => new Promise(resolve => setTimeout(resolve, 2e2)))()
    ws.send(JSON.stringify({
      status: current_game.status,
      name: current_game.name,
      client_connected: current_game.client_connected,
      generation_number: current_game.generation_number,
      best_fitness_score: current_game.best_fitness_score,
      total_population: current_game.population_size,
      number_finished_game: current_game.number_finished_game,
      available_individuals: current_game.available_individuals,
    }))
  })()
}
