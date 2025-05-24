export default class Network {
  /*
   * Internal properties
   */
  #specie = 0
  #input_nodes
  #output_nodes
  #hidden_nodes = {}
  // n is the total number of hidden nodes
  #n = 0
  #connections = {}
  #available_connections = {}
  // c is the total number of connections
  #c = 0
  #disabled_connections = 0
  #layers = []
  #compute_values = {}
  #feed_forward = true
  #fitness = 0
  #adjusted_fitness = 0

  /*
   * Private methods
   */

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
  constructor(inputs, outputs, hidden_nodes, connections) {
    this.#input_nodes = inputs
    this.#output_nodes = outputs
    for (let i in inputs) {
      for (let o in outputs) {
        if (this.#available_connections[inputs[i]] === undefined) {
          this.#available_connections[inputs[i]] = []
        }
        this.#available_connections[inputs[i]].push(outputs[o])
      }
    }
    for (let k in hidden_nodes) {
      this.add_node(hidden_nodes[k])
    }
    for (let k in connections) {
      this.add_connection(connections[k])
    }
    // TOOD: topological sort here
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
      n: this.#n,
      connections: connections,
      c: this.#c,
      disabled_connections: this.#disabled_connections,
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

  get_candidate_connection() {
    let size = 0
    for (let k in this.#available_connections) {
      size++
    }
    if (size === 0) {
      return undefined
    }
    let rnd_from = Math.floor(Math.random() * size)
    for (let from in this.#available_connections) {
      if (rnd_from <= 0) {
        return [from, Math.floor(Math.random() * this.#available_connections[from].length)]
      }
      rnd_from--
    }
    return undefined
  }

  get_random_connection() {
    if (this.#c > 0) {
      let rnd = Math.floor(Math.random() * (this.#c - this.#disabled_connections))
      for (let k in this.#connections) {
        // ignore disabled connections
        if (this.#connections[k].is_enabled()) {
          if (rnd <= 0) {
            return this.#connections[k]
          }
          rnd--
        }
      }
    }
    return undefined
  }

  get_random_node() {
    if (this.#n > 0) {
      let rnd = Math.floor(Math.random() * this.#n)
      for (let k in this.#hidden_nodes) {
        if (rnd <= 0) {
          return this.#hidden_nodes[k]
        }
        rnd--
      }
    }
    return undefined
  }

  disable_connection_by_innov(connection_innov) {
    this.#connections[connection_innov].disable()
  }

  get_fitness() {
    return this.#fitness
  }

  get_specie() {
    return this.#specie
  }

  get_weight() {
    return this.#weight
  }

  mutate_weight() {
    if (this.#connections.length === 0) {
      return
    }
    // TODO: check if this is really evenly distributed...
    const random_connection = this.get_random_connection()
    this.#connections[rnd].change_weight()
  }

  add_node(node) {
    if (this.#hidden_nodes[node.get_id()] === undefined) {
      this.#hidden_nodes[node.get_id()] = node.get_copy()
      this.#n++
    }
    return this.#hidden_nodes[node.get_id()]
  }

  add_connection(connection) {
    const conn = connection.get()
    const available_conn = this.#available_connections[conn.from]
    if (available_conn !== undefined && this.#connections[conn.innov] === undefined) {
      const idx = available_conn.indexOf(conn.to)
      if (idx !== -1) {
        // removing the connection from the array of available ones
        this.#available_connections[conn.from].splice(idx, 1)
        this.#connections[conn.innov] = connection.get_copy()
        this.#c++
        if (!#connections[conn.innov].is_enabled()) {
          this.#disabled_connections++
        }
        return this.#connections[conn.innov]
      }
    }
    return undefined
  }
}

