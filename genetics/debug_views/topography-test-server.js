
import { WebSocketServer } from 'ws'
import { activation } from '../neat/neat.js'
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

const test_network_phenotype = {
  nodes: {
    0: new Node(0, 'ident', () => {}, null, 'input'),
    1: new Node(1, 'ident', () => {}, null, 'input'),
    2: new Node(2, 'ident', () => {}, null, 'input'),
    3: new Node(3, 'ident', () => {}, null, 'bias'),
    6: new Node(6, 'sigmoid', () => {}, 2, 'hidden'),
    4: new Node(4, 'sigmoid', () => {}, null, 'output'),
    5: new Node(5, 'sigmoid', () => {}, null, 'output'),
  },
  connections: [
    {from: 0, to: 2, innov: 2, enabled: true, weight: 0.8},
    {from: 0, to: 5, innov: 5, enabled: false, weight: 0.7},
    {from: 2, to: 1, innov: 3, enabled: true, weight: 0.7},
    {from: 2, to: 4, innov: 3, enabled: true, weight: 0.7},
  ],
  layers: [
    [0, 1, 2, 3],
    [6],
    [4, 5],
  ]
}

const almost_real_network_test = new Network(
  {
    0: new Node(0, 'ident', () => {}, null, 'input'),
    1: new Node(1, 'ident', () => {}, null, 'input'),
    2: new Node(2, 'ident', () => {}, null, 'input'),
    3: new Node(3, 'ident', () => {}, null, 'bias'),
  },
  {
    4: new Node(4, 'ident', () => {}, null, 'output'),
    5: new Node(5, 'ident', () => {}, null, 'output'),
    6: new Node(6, 'ident', () => {}, null, 'output'),
  },
  {
    8: new Node(8, 'sigmoid', activation['sigmoid'], 0, 'hidden'),
    9: new Node(9, 'sigmoid', activation['sigmoid'], 10, 'hidden'),
    10: new Node(10, 'sigmoid', activation['sigmoid'], 7, 'hidden'),
  },
  {
    0: new Connection(0, 0, 4, 0.7, false),
    1: new Connection(1, 0, 5, 0.8, true),
    2: new Connection(2, 0, 6, 0.4, true),
    3: new Connection(3, 1, 4, 0.2, true),
    4: new Connection(4, 1, 5, 0.4, true),
    5: new Connection(5, 1, 6, 0.9, true),
    6: new Connection(6, 2, 4, 0.2, true),
    7: new Connection(7, 2, 5, 0.45, false),
    8: new Connection(8, 2, 6, 0.23, true),
    9: new Connection(9, 0, 8, 0.7, true),
    10: new Connection(10, 8, 4, 0.2, false),
    11: new Connection(11, 8, 9, 0.3, true),
    12: new Connection(12, 9, 4, 1, true),
    13: new Connection(13, 2, 10, 0.6, true),
    14: new Connection(14, 10, 5, 1, true),
  }
)


const real_network_phenotype = () => {
  const pop_test = new Population(1)

  pop_test.create_new_node('ident', 'input')
  pop_test.create_new_node('ident', 'input')
  pop_test.create_new_node('ident', 'input')
  pop_test.create_new_node('ident', 'input')
  pop_test.create_new_node('ident', 'input')
  pop_test.create_new_node('ident', 'input')
  pop_test.create_new_node('ident', 'input')

  pop_test.create_new_node('sigmoid', 'output')
  pop_test.create_new_node('sigmoid', 'output')
  pop_test.create_new_node('sigmoid', 'output')

  pop_test.initialize()
  return pop_test.get_phenotype(0)
}

wss.on('connection', (ws) => {
  console.log('Client connected!')

  ws.send(JSON.stringify({phenotype: {...almost_real_network_test.get_phenotype()}}))
  // ws.send(JSON.stringify({phenotype: {...test_network_phenotype}}))
  // ws.send(JSON.stringify({phenotype: {...test_network_phenotype}}))

  ws.on('error', console.error)
  ws.on('close', () => {
    console.log('Client closed!')
  })
})


