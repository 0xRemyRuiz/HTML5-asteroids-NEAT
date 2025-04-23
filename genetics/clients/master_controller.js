
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
        current_game.client_connected = 0
        current_game.generation_number = 0
        current_game.best_fitness_score = 0
        current_game.number_finished_game = 0
        current_game.total_population = 0
        wss.clients.forEach((client) => {
          client.send(JSON.stringify({msg: 'game change'}))
        })
        response = 'Game has changed to '+current_game.name
        code = 'info'
      }
    } else {
      response = 'ERROR: command not found, type "list" to get the command list'
      code = 'error'
    }
    ws.send(JSON.stringify({response, code}))
  }

  // stagger answers to save computational speed for games
  (async () => {
    await (() => new Promise((resolve) => {setTimeout(resolve, 2e2)}))()
    ws.send(JSON.stringify(current_game))
  })()
}
