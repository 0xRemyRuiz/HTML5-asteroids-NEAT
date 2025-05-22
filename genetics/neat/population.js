import {config, activation} from './neat.js'

import Network from './network.js'
import Node from './node.js'
import Connection from './connection.js'

export default class Population {
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
  #specie_id = 0

  /*
   * Private methods
   */
  #add_new_connection(from, to) {
    for (let k in this.#connections) {
      if (this.#connections[k].from === from && this.#connections[k].to === to) {
        // if such connection already exists, return the connection
        return this.#connections[k]
      }
    }
    // else create a new connection and increment the innovation number
    const new_connection = new Connection(this.#connection_innovation_number, from, to)
    this.#connections[this.#connection_innovation_number] = new_connection
    this.#connection_innovation_number++
    return new_connection
  }

  #create_new_specie(network) {
    this.#species[this.#specie_id] = {
      // TODO: parametrize this
      shield: 3,
      representative: network,
    }
    this.#specie_id++
  }

  #mutate_network(network_id) {
    // if (Math.random() <= 1)
    // TODO: parametrize from config  'mutation_rates': [0.5, 0.3, 0.2],
    if (Math.random() <= 0.5) {
      // mutate connection weight
      this.#networks[network_id].mutate_weight()
    }
    if (Math.random() <= 0.3) {
      // mutate connection add
    }
    if (Math.random() <= 0.2) {
      // mutate node add
    }
  }

  /*
   * Public methods
   */
  // DEBUG ONLY
  get_blob() {
    return {
      m: this.#m,
      node_uid: this.#node_uid,
      input_nodes: (() => {
        const in_nodes = []
        for (let k in this.#input_nodes) {
          in_nodes.push(this.#input_nodes[k].get())
        }
        return in_nodes
      })(),
      output_nodes: (() => {
        const o_nodes = []
        for (let k in this.#output_nodes) {
          o_nodes.push(this.#output_nodes[k].get())
        }
        return o_nodes
      })(),
      connection_innovation_number: this.#connection_innovation_number,
      connections: (() => {
        const con = []
        for (let k in this.#connections) {
          con.push(this.#connections[k].get())
        }
        return con
      })(),
      num_networks: this.#networks.length,
      species: this.#species,
    }
  }

  create_new_node(activation_name, type = 'hidden', parent = null) {
    // TODO: eventually ensure that input and output nodes can't be added after initialization
    // new_node here is a function as it acts as a generator, allocating the new_node only if needed and deduplicating code
    const new_node = () => new Node(this.#node_uid, activation_name, activation[activation_name], type, parent)

    if (type === 'hidden') {
      // if it is a hidden node, check parent connection to ensure uniqueness
      if (parent === null) {
        console.warn('Warning: Population.create_new_node method for hidden node requires a 3rd parameter parent')

      } else if (this.#nodes[parent] === undefined) {
        this.#nodes[parent] = new_node()
      }

    } else if (type === 'input' || type === 'bias') {
      this.#input_nodes[this.#node_uid] = new_node()
      this.#m++

    } else if (type === 'output') {
      this.#output_nodes[this.#node_uid] = new_node()
      this.#m++

    } else {
      return false
    }

    this.#node_uid++
    return true
  }

  initialize(adam = null, pop_size = 15) {
    if (!adam) {
      const connections = {}
      // let's say, in NEAT, we have a starting individual (adam) with every input connected to every output
      for (let i in this.#input_nodes) {
        // except for bias
        if (this.#input_nodes[i].get_type() === 'bias') {
          continue
        }
        for (let o in this.#output_nodes) {
          const connection = this.#add_new_connection(this.#input_nodes[i].get_id(), this.#output_nodes[o].get_id())
          connections[connection.get_innov()] = connection
        }
      }
      adam = new Network({}, connections)
    }
    this.#create_new_specie(adam)
    for (let i = pop_size; i > 0; i--) {
      const new_network = adam.get_copy()
      // mutate the network
      // TODO: do real mutation here!
      new_network.set_fitness(Math.random(), 5)
      // add to the pool
      this.#networks.push(new_network)
    }
  }

  breed_new_population() {
    // TODO: STEP 0 elitism
    const get_the_networks = (networks = this.#networks) => {
      const nets = []
      for (let i = 0; i < networks.length; i++) {
        nets.push([i, networks[i].get_fitness()])
      }
      return nets
    }
    console.log("========BEFORE========", get_the_networks())
    this.#networks.sort((a, b) => a.get_fitness() < b.get_fitness() ? 1 : -1)
    // TODO: replace with the config version of this value
    const real_elitism = this.#networks.length / 100 * 20
    console.log("removing:", real_elitism, "========DURING========", get_the_networks())
    const eliminated = this.#networks.slice(real_elitism)
    console.log("========ELIMINATED========", get_the_networks(eliminated))
    // TODO: check for shielded species members to spare from removal
    this.#networks = this.#networks.slice(0, real_elitism)
    console.log("========AFTER========", get_the_networks())
    // TODO: STEP 1 loop through remaning individuals
    // TODO: STEP 1a mutate
    // TODO: calc specie dist: δ = (c1 * E) / N + (c2 * D) / N + c3 * W
    // TODO: explicit fitenss sharing: f′ = fi / ∑(n, j=1)(sh(δ(i, j))
    //       sh(δ(i, j) = 0 if δt is above δ threshold else it is 1
    // Explicit sharing function is used to limit the growth of a specie in terms of individual
  }

  get_population_size() {
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

    const base_phenotype = this.#networks[network_idx].get_genotype()
    return { network, nodes, connections }
  }
}
