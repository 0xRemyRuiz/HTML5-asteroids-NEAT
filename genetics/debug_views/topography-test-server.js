
import { WebSocketServer } from 'ws'
import {Network, Node, Connection} from '../neat/network.js'

const PORT = parseInt(process.argv[2]) || 3000

let wss
try {
  wss = new WebSocketServer({ port: PORT })
} catch (e) {
  console.error(e)
  exit(1)
}

console.log('Websocket running on port '+PORT)



const base_network = {
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





wss.on('connection', (ws) => {
  console.log('Client connected!')
  ws.send(JSON.stringify({phenotype: {...base_network}}))

  ws.on('error', console.error)
  ws.on('close', () => {
    console.log('Client closed!')
  })
})


