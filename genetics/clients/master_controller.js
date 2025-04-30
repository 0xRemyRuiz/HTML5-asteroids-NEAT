

export default (wss, current_game, ws, object) => {
  // Puppet Master Commander
  if (object.command) {
    let response = '', code = ''
    if (object.command === 'list') {
      response = '<p style="margin: 0">Command list</p>'
      response += '<ul style="margin: 0">'
      response += '<li>change <i>"game name"</i></li>'
      response += '</ul>'
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
        response = 'Game has changed to '+current_game.name
        code = 'info'
      }

    } else if (object.command === 'lock') {
      wss.clients.forEach((client) => {
        client.send(JSON.stringify({msg: 'lock'}))
      })

    } else if (object.command === 'unlock') {
      wss.clients.forEach((client) => {
        client.send(JSON.stringify({msg: 'unlock'}))
      })

    } else if (object.command === 'init') {
      if (current_game.name === null) {
        response = 'ERROR: command init failed, not game chosen'
        code = 'error'
      } else {
        current_game.generation_number = 0
        current_game.status = 'init'
      }

    } else if (object.command === 'run') {
      if (current_game.status !== 'ready') {
        response = 'ERROR: command run failed, you need to "init" after a "change [game]"'
        code = 'error'
      }
      current_game.status = 'running'
      wss.clients.forEach((client) => {
        client.send(JSON.stringify({ msg: 'start' }))
      })

    } else {
      response = 'ERROR: command not found, type "list" to get the command list'
      code = 'error'
    }
    ws.send(JSON.stringify({response, code}))
  }

  // stagger answers to master controller to save computational speed for games (clients)
  (async () => {
    await (() => new Promise((resolve) => {setTimeout(resolve, 2e2)}))()
    ws.send(JSON.stringify({
      status: current_game.status,
      name: current_game.name,
      client_connected: current_game.client_connected,
      generation_number: current_game.generation_number,
      best_fitness_score: current_game.best_fitness_score,
      total_population: current_game.population.length,
      number_finished_game: current_game.number_finished_game,
    }))
  })()
}
