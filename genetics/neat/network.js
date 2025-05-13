import {config, activation} from './neat.js'

export class Node {
  /*
   * Internal properties
   */
  #id
  #activation_name
  #activation_func
  #parent
  #type
  value = 1 // this is default but only really applicable to bias node

  /*
   * Public methods
   */
  constructor(id, activation_name, activation_func, parent, type) {
    this.#id = id
    this.#activation_name = activation_name
    this.#activation_func = activation_func
    this.#parent = parent
    this.#type = type
  }

  change_activation(activation_name, activation_func) {
    if (type === 'hidden') {
      this.#activation_name = activation_name
      this.#activation_func = activation_func
      return true
    }
    return false
  }

  copy() {
    // pass over a copy of this node
    return new Node(this.#type, this.#id, this.#activation_name, this.#activation_func)
  }

  get_id() {
    return this.#id
  }

  get_type() {
    return this.#type
  }

  get_parent() {
    return this.#parent
  }

  get_activation_name() {
    return this.#activation_name
  }
}

export class Connection {
  /*
   * Internal properties
   */
  #enabled = true
  #innov = null
  #from = null
  #to = null
  #weight = null

  /*
   * Public methods
   */
  constructor(innov, from, to, weight = Math.random()) {
    this.#innov = innov
    this.#from = from
    this.#to = to
    this.#weight = weight
  }

  toggle_enable() {
    this.#enabled = !this.#enabled
  }

  disable() {
    this.#enabled = false
  }

  change_weight(weight = Math.random()) {
    this.#weight = weight
  }

  copy() {
    return new Connection(this.#innov, this.#from, this.#to, this.#weight)
  }

  get_innov() {
    return this.#innov
  }

  get_id() {
    return this.#from+'-'+this.#to+'-'+this.#innov
  }
}

export class Network {
  /*
   * Internal properties
   */
  #specie = "null"
  #hidden_nodes = {}
  #layers = []
  // n is the total number of hidden nodes
  #n = 0
  #connections = {}
  #compute_values = {}
  #feed_forward = true
  #fitness = 0

  /*
   * Public methods
   */
  update_specie() {
    const node_ids_list = []
    for (k in this.#hidden_nodes) {
      node_ids_list.append(k)
    }
    if (node_ids_list.length === 0) {
      this.#specie = "null"
    } else {
      node_ids_list.sort((a, b) => a <= b ? -1 : 1)
      this.#specie = node_ids_list[0].toString()
      for (let i = 1; i < node_ids_list.length; i++) {
        this.#specie += "-"+node_ids_list[i].toString()
      }
    }
  }

  /* On fitness (from NEAT paper)
     ----------------------------
    One way to force minimal topologies is to incorporate network size into the fitness
    function[...]. In such methods, larger networks have their fitnesses penalized. Although
    [...] Altering the fitness function is ad hoc and may cause evolution to perform
    differently than the designer of the original unmodified fitness function intended.

    Idea from it
    ------------
    given:
    -`F` being the base calculated fitness score from game
    -`m` being the base number of input and output nodes
    -`n` being the number of hidden nodes
    -`F'` being the final fitness score "adjusted"
    we have:
    F' = F * (1 + m / (m + n))

    The idea here is that, in fact, "penalizing" the fitness score can damage the base calculation.
    However, "augmenting" the score by a factor on the interval `] 1 ; 2 ]` and with the `1 / x`
    distribution curve might be interesting. Still the final fitness depends on base calculation.
    Here `m / n` is used instead of `1 / n` to not penalize NN with huge number of input and output.
  */
  set_fitness(score, m) {
    this.#fitness = score * (1 + m / (m + this.#n))
  }

  get_phenotype() {

    return { specie: this.#specie, hidden_nodes: this.#hidden_nodes, connections: this.#connections }
  }

  get_random_connection() {
    return this.#connections[Math.floor(Math.random() * this.#connections.length)]
  }

  get_random_node() {
    if (this.#hidden_nodes.length > 0) {
      return this.#hidden_nodes[Math.floor(Math.random() * this.#hidden_nodes.length)]
    }
    return undefined
  }


  add_node(node) {
    this.#hidden_nodes[node.get_id()] = node
  }

  add_connection(connection) {

  }
}

