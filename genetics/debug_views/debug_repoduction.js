
import { WebSocketServer } from 'ws'
import { activation } from '../neat/neat.js'
import Population from '../neat/population.js'
import Network from '../neat/network.js'
import Node from '../neat/node.js'
import Connection from '../neat/connection.js'

import reporter from '../libs/reporter.js'

const PORT = parseInt(process.argv[2]) || 3000

let wss
try {
  wss = new WebSocketServer({ port: PORT })
} catch (e) {
  console.error(e)
  exit(1)
}

console.log('Websocket running on port '+PORT)

const do_original_scheme_test = () => {
  const pop_test = new Population(1)
  // example from the original paper, figure 3.3 page 37 (in last paper)
  const original_example_base = {
    inputs: {
      0: new Node(0, 'ident', () => {}, null, 'bias'),
      1: new Node(1, 'ident', () => {}, null, 'input'),
      2: new Node(2, 'ident', () => {}, null, 'input'),
    },
    outputs: {
      3: new Node(3, 'sigmoid', () => {}, null, 'output'),
    },
  }
  const original_example = {

    parent1: new Network(
      original_example_base.inputs,
      original_example_base.outputs,
      {
        4: new Node(4, 'sigmoid', activation['sigmoid'], 1, 'hidden'),
      },{
        0: new Connection(0, 0, 3, 0.7, true),
        1: new Connection(1, 1, 3, 0.8, false),
        2: new Connection(2, 2, 3, 0.4, true),
        3: new Connection(3, 1, 4, 0.2, true),
        4: new Connection(4, 3, 4, 0.4, true),
        7: new Connection(7, 0, 4, 0.45, true),
      },
    ),

    parent2: new Network(
      original_example_base.inputs,
      original_example_base.outputs,
      {
        4: new Node(4, 'sigmoid', activation['sigmoid'], 1, 'hidden'),
        5: new Node(5, 'sigmoid', activation['sigmoid'], 4, 'hidden'),
      },{
        0: new Connection(0, 0, 3, 0.7, true),
        1: new Connection(1, 1, 3, 0.8, false),
        2: new Connection(2, 2, 3, 0.4, true),
        3: new Connection(3, 1, 4, 0.2, true),
        4: new Connection(4, 3, 4, 0.4, false),
        5: new Connection(5, 4, 5, 0.9, true),
        6: new Connection(6, 3, 5, 0.2, true),
        8: new Connection(8, 2, 4, 0.23, true),
        9: new Connection(9, 0, 5, 0.7, true),
      },
    ),

  }

  // don't forget to initialize the input and output nodes
  pop_test.create_new_node('ident', 'input')
  pop_test.create_new_node('ident', 'input')
  pop_test.create_new_node('sigmoid', 'output')

  // then set a fitness (equal or not)
  original_example.parent1.set_fitness(100.123)
  original_example.parent2.set_fitness(100.123)

  const offspring = pop_test.reproduce(original_example.parent1, original_example.parent2)
  return { parent1: original_example.parent1, parent2: original_example.parent2, offspring }
}

wss.on('connection', (ws) => {
  console.log('Client connected!')

  // ws.send(JSON.stringify({phenotype: {...pop_test.get_phenotype(0)}}))
  ws.on('message', () => {
    try {
      res = do_original_scheme_test()
      ws.send(JSON.stringify({
        type: 'test', name: 'test', seed: null,
        parent1: res.parent1.get_phenotype(),
        parent2: res.parent2.get_phenotype(),
        offspring: res.offspring.get_phenotype(),
      }))
    } catch (e) {
      ws.send(JSON.stringify(reporter.get_last_report()))
    }
  })

  ws.on('error', console.error)
  ws.on('close', () => {
    console.log('Client closed!')
  })
})


