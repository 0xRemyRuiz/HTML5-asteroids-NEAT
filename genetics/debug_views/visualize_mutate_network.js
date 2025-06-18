
import { WebSocketServer } from 'ws'
import { activation } from '../neat/neat.js'
import Population from '../neat/population.js'
import Network from '../neat/network.js'
import Node from '../neat/node.js'
import Connection from '../neat/connection.js'

const PORT = parseInt(process.argv[2]) || 3000

let wss
try {
  wss = new WebSocketServer({ port: PORT })
} catch (e) {
  console.error(e)
  exit(1)
}

console.log('Websocket running on port '+PORT)

const real_network_phenotype = () => {
  const pop_test = new Population(1)

  pop_test.create_new_node('ident', 'input')
  pop_test.create_new_node('ident', 'input')
  pop_test.create_new_node('ident', 'input')
  // pop_test.create_new_node('ident', 'input')
  // pop_test.create_new_node('ident', 'input')
  // pop_test.create_new_node('ident', 'input')
  // pop_test.create_new_node('ident', 'input')

  pop_test.create_new_node('sigmoid', 'output')
  pop_test.create_new_node('sigmoid', 'output')
  // pop_test.create_new_node('sigmoid', 'output')

  pop_test.initialize()
  return pop_test
}

const pop_test = real_network_phenotype()

wss.on('connection', (ws) => {
  console.log('Client connected!')

  ws.send(JSON.stringify({phenotype: {...pop_test.get_phenotype(0)}}))
  ws.on('message', () => {
    pop_test.test_mutation_on_network(0)
    ws.send(JSON.stringify({phenotype: {...pop_test.get_phenotype(0)}}))
  })

  ws.on('error', console.error)
  ws.on('close', () => {
    console.log('Client closed!')
  })
})


