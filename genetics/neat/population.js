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
  // parents are a list of acenstry updated when a connection is split in two and a node created
  #parents = {}
  #connection_innovation_number = 0
  #connections = {}
  #networks = []
  #species = {}
  #specie_id = 0

  /*
   * Private methods
   */
  #create_new_connection(from, to, weight = 1) {
    for (let k in this.#connections) {
      if (this.#connections[k].from === from && this.#connections[k].to === to) {
        // if such connection already exists, return the connection
        return this.#connections[k]
      }
    }
    // else create a new connection and increment the innovation number
    const new_connection = new Connection(this.#connection_innovation_number, from, to, weight)
    this.#connections[this.#connection_innovation_number] = new_connection
    this.#connection_innovation_number++
    return new_connection
  }

  #create_new_specie_from_network(network) {
    this.#species[this.#specie_id] = {
      // TODO: parametrize this from config
      shield: 3,
      representative: network,
    }
    this.#specie_id++
  }

  #mutate_network_by_id(network_idx) {
    // if (Math.random() <= 1)
    // TODO: parametrize from config  'mutation_rates': [0.5, 0.3, 0.2],
    const selected_network = this.#networks[network_idx]

    // CONNECTION MUTATE
    if (Math.random() <= 0.6) {
      selected_network.mutate_weight()
    }

    // CONNECTION ADD
    if (Math.random() <= 0.4) {
      // mutate connection add
      const candidate_connection = selected_network.get_candidate_connection()
      // did we find a viable candidate?
      if (candidate_connection !== undefined) {
        // TODO: maybe parametrize the random weight selection
        this.#create_new_connection(candidate_connection[0], candidate_connection[1], Math.random())
      }
    }

    /* From NEAT 2nd paper
       -------------------
       "The old connection is disabled and two new connections are added to the genome.
        The new connection leading into the new node receives a weight of 1, and the new
        connection leading out receives the same weight as the old connection."
     */
    // NODE ADD
    if (Math.random() <= 0.2) {
      // TODO: try to refactor here
      const candidate_connection = selected_network.get_random_connection()
      // if there is at least one viable candidate to be split
      if (candidate_connection !== undefined) {
        // create the node
        let new_node = undefined
        if (this.parents[candidate_connection.get_innov()] === undefined) {
          const new_node_id = this.create_new_node('sigmoid', 'hidden', candidate_connection.get_innov())
          if (new_node_id !== null) {
            new_node = this.#nodes[new_node_id]
          }
        } else {
          // or grab the already existing gene
          new_node = this.parents[candidate_connection.get_innov()]
        }
        // only if the new node creation process succeeded we continue
        if (new_node !== undefined) {
          selected_network.add_node(new_node)
          const old_conn = candidate_connection.get()
          selected_network.disable_connection_by_innov(old_conn.innov)
          // create first connection with weight = 1
          const c1 = this.#create_new_connection(old_conn.from, old_conn.to)
          selected_network.add_connection(c1)
          // create second connection with the weight from the old connection
          const c2 = this.#create_new_connection(old_conn.from, old_conn.to, old_conn.weight)
          selected_network.add_connection(c2)
        }
      }
    }

    // BIAS MUTATE
    if (Math.random() <= 0.05) {
      // mutate bias value
      // TODO TODO
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
    const id = this.#node_uid

    if (type === 'hidden') {
      // if it is a hidden node, check parent connection to ensure uniqueness
      if (isNaN(parent)) {
        console.warn('Warning: Population.create_new_node method for hidden node requires a 3rd parameter parent of type number')
        return null

      } else if (this.#nodes[parent] === undefined) {
        this.#nodes[this.#node_uid] = new_node()
        this.#parents[parent] = this.#nodes[this.#node_uid]
      }

    } else if (type === 'input' || type === 'bias') {
      this.#input_nodes[this.#node_uid] = new_node()
      this.#m++

    } else if (type === 'output') {
      this.#output_nodes[this.#node_uid] = new_node()
      this.#m++

    } else {
      return null
    }

    this.#node_uid++
    return id
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
          const new_connection = this.#create_new_connection(this.#input_nodes[i].get_id(), this.#output_nodes[o].get_id())
          connections[new_connection.get_innov()] = new_connection
        }
      }
      adam = new Network({}, connections)
    }
    this.#create_new_specie_from_network(adam)
    // set the shield value for the first the initial specie to 0
    this.#species[0].shield = 0
    for (let i = pop_size; i > 0; i--) {
      const new_network = adam.get_copy()
      // mutate the network
      this.#mutate_network_by_id(new_network.get_id())
      // add to the pool
      this.#networks.push(new_network)
    }
  }

  breed_new_population() {
    //- STEP 0: elitism
    const get_the_networks = (networks = this.#networks) => {
      const nets = []
      for (let i = 0; i < networks.length; i++) {
        nets.push([i, networks[i].get_fitness(), networks[i].get_specie()])
      }
      return nets
    }
    this.#networks.sort((a, b) => a.get_fitness() < b.get_fitness() ? 1 : -1)
    // TODO: replace with the config version of this value
    const real_elitism = this.#networks.length * 0.2
    const eliminated = this.#networks.slice(real_elitism)
    const saved = eliminated.filter((net) => this.#species[net.get_specie()].shield > 0)
    // TODO: check for shielded species members to spare from removal
    this.#networks = this.#networks.slice(0, real_elitism)
    //- STEP 1: loop through remaning individuals
    for (let k in this.#networks) {
      // TODO: STEP 1a breed children
      // TODO: STEP 1b loop through children
      // TODO: STEP 1c mutate child
      // TODO: calc specie dist: δ = (c1 * E) / N + (c2 * D) / N + c3 * W
      // TODO: explicit fitenss sharing: f′ = fi / ∑(n, j=1)(sh(δ(i, j))
      //       sh(δ(i, j) = 0 if δt is above δ threshold else it is 1
    }
    // Explicit sharing function is used to limit the growth of a specie in terms of individual
    // Decrease each remaining shield value for species
    for (let k in this.#species) {
      if (this.#species[k].shield > 0) {
        this.#species[k].shield--
      }
    }
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
