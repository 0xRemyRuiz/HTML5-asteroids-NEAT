import {Network, Node, Connection} from './network.js'
import {config, activation} from './neat.js'

export class Population {
  /*
   * Internal properties
   */
  // we're not using javascript Set here because it has very limited capacity
  // instead we'll use a hash maps to store nodes
  // also, input and output nodes has to be immutable
  #input_nodes = {}
  #output_nodes = {}
  // m is the total number of input and output nodes
  #m = 0
  #node_uid = 0
  #nodes = {}
  #connection_innovation_number = 0
  #connections = {}
  #networks = []
  #species = {}

  /*
   * Private methods
   */
  #add_new_connection(from, to) {
    for (k in this.#connections) {
      if (this.#connections[k].from === from && this.#connections[k].to === to) {
        // if such connection already exists, return the connection
        return this.#connections[k]
      }
    }
    // else create a new connection and increment the innovation number
    const new_connection = new Connection(this.#connection_innovation_number, from, to)
    this.#connections[this.#connection_innovation_number] = new_connection
    this.#connection_innovation_number++
    return true
  }

  /*
   * Public methods
   */
  get_blob() {
    return {
      m: this.#m,
      node_uid: this.#node_uid,
      input_nodes: this.#input_nodes,
      output_nodes: this.#output_nodes,
      connection_innovation_number: this.#connection_innovation_number,
      connections: this.#connections,
      num_networks: this.#networks.length,
      species: this.#species,
    }
  }

  create_new_node(activation_name, type = 'hidden', parent = null) {
    // TODO: eventually ensure that input and output nodes can't be added after initialization
    const new_node = new Node(this.#node_uid, activation_name, activation[activation_name], parent, type)

    if (type === 'hidden') {
      // if it is a hidden node, check parent connection to ensure uniqueness
      if (parent === null) {
        console.warn('Warning: Population.create_new_node method for hidden node requires a 3rd parameter parent')

      } else if (this.#nodes[new_node.get_parent()] === undefined) {
        this.#nodes[new_node.get_parent()] = new_node
      }

    } else if (type === 'input' || type === 'bias') {
      this.#input_nodes[this.#node_uid] = new_node
      this.#m++

    } else if (type === 'output') {
      this.#output_nodes[this.#node_uid] = new_node
      this.#m++

    } else {
      return false
    }

    this.#node_uid++
    return true
  }

  initialize(pop_size = 150) {
    for (let i = pop_size; i > 0; i--) {

    }
  }

  get_total_population() {
    return this.#networks.length
  }

  set_fitness(network_idx, fitness) {
    this.#networks[network_idx].set_fitness(fitness, this.#m)
  }

  get_phenotype(network_idx) {
    // Expected minimal structure of phenotype for visualization
    // {
    //   specie: 'stringExample',                                     // specie:        string
    //   nodes: {                                                     // nodes:         object
    //     0: {layer: 0},                                             // node:          object
    //     2: {layer: 1},
    //     1: {layer: 2},
    //   },
    //   connections: [                                               // connections:   array
    //     {from: 0, to: 2, innov: 2, enabled: true, weight: 1.2},    // connection:    object
    //     {from: 0, to: 1, innov: 5, enabled: false, weight: 0.7},
    //     {from: 2, to: 1, innov: 3, enabled: true, weight: 0.7},
    //   ],
    //   layers: [                                                    // layers:        array
    //     [0],                                                       // layer:         array
    //     [2],
    //     [1],
    //   ]
    // }

    const base_phenotype = this.#networks[network_idx].get_phenotype()
    return { network, nodes, connections }
  }
}
