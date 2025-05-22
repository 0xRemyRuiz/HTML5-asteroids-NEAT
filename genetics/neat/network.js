export default class Network {
  /*
   * Internal properties
   */
  #specie = 0
  #hidden_nodes = {}
  #layers = []
  // n is the total number of hidden nodes
  #n = 0
  #connections = {}
  #compute_values = {}
  #feed_forward = true
  #fitness = 0
  #adjusted_fitness = 0

  /*
   * Private methods
   */
  #connect_nodes(connection) {
    this.#connections.push(connection)
  }

  /*
   * Public methods
   */
  /* On fitness (from NEAT 2nd paper)
     --------------------------------
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
  constructor(hidden_nodes, connections) {
    // TODO: maybe check for types here
    for (let k in hidden_nodes) {
      this.#hidden_nodes[k] = hidden_nodes[k].get_copy()
    }
    for (let k in connections) {
      this.#connections[k] = connections[k].get_copy()
    }
  }

  set_fitness(fitness, m) {
    // Idea is set aside for the moment
    // this.#fitness = score * (1 + m / (m + this.#n))
    this.#fitness = fitness
  }

  set_specie(specie) {
    this.#specie = specie
  }

  get_genotype() {
    return { specie: this.#specie, hidden_nodes: this.#hidden_nodes, connections: this.#connections }
  }

  get_blob() {
    const connections = {}
    for (let k in this.#connections) {
      connections[k] = this.#connections[k].get()
    }
    const hidden_nodes = {}
    for (let k in this.#hidden_nodes) {
      hidden_nodes[k] = this.#hidden_nodes[k].get()
    }
    return {
      specie: this.#specie,
      hidden_nodes: hidden_nodes,
      layers: this.#layers,
      // n is the total number of hidden nodes
      n: this.#n,
      connections: connections,
      compute_values: this.#compute_values,
      feed_forward: this.#feed_forward,
      fitness: this.#fitness,
      adjusted_fitness: this.#adjusted_fitness,
    }
  }

  get_copy() {
    const connections = {}
    for (let k in this.#connections) {
      connections[k] = this.#connections[k]
    }
    const hidden_nodes = {}
    for (let k in this.#hidden_nodes) {
      hidden_nodes[k] = this.#hidden_nodes[k]
    }
    return new Network(hidden_nodes, connections)
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

  get_fitness() {
    return this.#fitness
  }

  mutate_weight() {
    if (this.#connections.length === 0) {
      return
    }
    // TODO: check if this is really evenly distributed...
    const rnd = Math.floor(Math.random() * (this.#connections.length + 1)) - 1
    this.#connections[rnd].change_weight()
  }

  add_node(node) {
    /* From NEAT 2nd paper
       -------------------
       "The old connection is disabled and two new connections are added to the genome.
        The new connection leading into the new node receives a weight of 1, and the new
        connection leading out receives the same weight as the old connection."
     */
    this.#hidden_nodes[node.get_id()] = node
  }

  add_connection(connection) {

  }
}

