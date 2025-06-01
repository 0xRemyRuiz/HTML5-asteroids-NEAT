import Node from './node.js'
import Connection from './connection.js'

export default class Network {
  /*
   * Internal properties
   */
  #feed_forward = true
  #input_nodes
  #output_nodes
  #hidden_nodes = {}
  // n is the total number of hidden nodes
  #n = 0
  #connections = {}
  // c is the total number of connections
  #c = 0
  #disabled_connections = 0
  // hashmap to keep values before being computed
  #compute_values = {}
  #fitness = 0
  // the adjusted fitness is mitigated by f′ = fi / ∑(n, j=1)(sh(δ(i, j))
  #adjusted_fitness = 0

  // insights
  // topologically sorted nodes
  #sorted_nodes = []
  // layers computed from sorted nodes
  #layers = []
  // simple connection hash map for fast check (like a dict of array in python)
  #connection_set = {}
  // available connections computed from layers
  #available_connections = {}

  /*
   * Private methods
   */
  #update_insights() {
    // 
    // STEP 1
    // topologically sort nodes based on connections
    const adjacency = {}
    for (let k in this.#connections) {
      const conn = this.#connections[k].get()
      if (adjacency[conn.from] === undefined) {
        adjacency[conn.from] = []
      }
      adjacency[conn.from].push(conn.to)
    }

    const visited = new Set()
    this.#sorted_nodes = []
    const dfs = (node) => {
      if (visited.has(node)) {
        return
      }
      visited.add(node)
      for (let k in adjacency[node]) {
        dfs(adjacency[node][k])
      }
      this.#sorted_nodes.unshift(node)
    }

    for (let k in this.#input_nodes) {
      dfs(this.#input_nodes[k].get_id())
    }

    // 
    // STEP 2
    // once the topological order has been computed, we compute per layer order
    const node_to_layer = {}
    const layers = {}

    for (const node_id of this.#sorted_nodes) {
      // skip output nodes
      if (this.#output_nodes[node_id]) {
        continue
      }
      // Find all incoming enabled connections to this node
      const incoming_layers = []
      for (const k in this.#connections) {
        const conn = this.#connections[k].get()
        if (conn.to == node_id && conn.from in node_to_layer) {
          incoming_layers.push(node_to_layer[conn.from])
        }
      }

      const layer = incoming_layers.length > 0 ? Math.max(...incoming_layers) + 1 : 0
      node_to_layer[node_id] = layer

      if (!layers[layer]) {
        layers[layer] = []
      }
      layers[layer].push(node_id)
    }

    // Convert layers object to ordered array
    // this sh*t below has been AI generated (chatGPT 05/2025)
    // const result = [];
    // const sortedLayerIndices = Object.keys(layers).map(Number).sort((a, b) => a - b);
    // for (const index of sortedLayerIndices) {
    //   result.push(layers[index]);
    // }
    // I mean...counting from 0 to x is waaaaayyyyy better...

    this.#layers = []
    // add input nodes add layer 0
    this.#layers.push(Object.keys(this.#input_nodes).map((s) => parseInt(s)))
    // add hidden nodes
    let idx = 0
    for (let k in layers) {
      if (idx !== 0) {
        // skip index zero, we add input nodes afterward since they could be not connected
        this.#layers.push(layers[idx.toString()])
      }
      idx++
    }
    // add output nodes add the end
    this.#layers.push(Object.keys(this.#output_nodes).map((s) => parseInt(s)))

    // 
    // STEP 3
    // now that layers have been computed we compute available connections
    this.#available_connections = {}
    // each row
    for (let i = 0; i < this.#layers.length - 1; i++) {
      // each cell
      for (let x = 0; x < this.#layers[i].length; x++) {
        const node_from = this.#layers[i][x]
        this.#available_connections[node_from] = []
        // each target row
        for (let j = i + 1; j < this.#layers.length; j++) {
          // each target cell
          for (let y = 0; y < this.#layers[j].length; y++) {
            const node_to = this.#layers[j][y]
            if (this.#connection_set[node_from] === undefined
              || !this.#connection_set[node_from].includes(node_to)) {
              this.#available_connections[node_from].push(node_to)
            }
          }
        }
      }
    }
  }

  /*
   * Public methods
   */
  constructor(inputs, outputs, hidden_nodes, connections) {
    this.#input_nodes = inputs
    this.#output_nodes = outputs
    for (let k in hidden_nodes) {
      this.add_node(hidden_nodes[k], false)
    }
    for (let k in connections) {
      this.#connections[k] = connections[k].get_copy()
      this.#c++
      if (!this.#connections[k].is_enabled()) {
        this.#disabled_connections++
      }
      const conn = this.#connections[k].get()
      if (this.#connection_set[conn.from] === undefined) {
        this.#connection_set[conn.from] = []
      }
      this.#connection_set[conn.from].push(conn.to)
    }
    // topologically sort the nodes then generate layers then generate available connection hash map
    this.#update_insights()
  }

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
  set_fitness(fitness, m) {
    // Idea is set aside for the moment
    // this.#fitness = score * (1 + m / (m + this.#n))
    this.#fitness = fitness
  }

  get_phenotype() {
    const get_objects = (obj) => {
      const res = {}
      for (let k in obj) {
        res[k] = obj[k].get()
      }
      return res
    }
    const nodes = {}
    Object.assign(nodes, get_objects(this.#input_nodes))
    Object.assign(nodes, get_objects(this.#hidden_nodes))
    Object.assign(nodes, get_objects(this.#output_nodes))
    return {
      nodes: nodes,
      connections: get_objects(this.#connections),
      layers: this.#layers,
    }
  }

  // DEBUG ONLY
  get_blob() {
    const get_things = (thingy) => {
      const res = {}
      for (let k in thingy) {
        res[k] = thingy[k].get()
      }
      return res
    }
    return {
      feed_forward: this.#feed_forward,
      input_nodes: get_things(this.#input_nodes),
      output_nodes: get_things(this.#output_nodes),
      hidden_nodes: get_things(this.#hidden_nodes),
      n: this.#n,
      connections: get_things(this.#connections),
      c: this.#c,
      disabled_connections: this.#disabled_connections,
      compute_values: this.#compute_values,
      fitness: this.#fitness,
      adjusted_fitness: this.#adjusted_fitness,
      sorted_nodes: this.#sorted_nodes,
      // layers computed from sorted nodes
      layers: this.#layers,
      // simple connection hash map for fast check (like a dict of array in python)
      connection_set: this.#connection_set,
      // available connections computed from layers
      available_connections: this.#available_connections,
    }
  }

  get_copy() {
    const deep_copy = (src) => {
      const obj = {}
      for (let k in src) {
        obj[k] = src[k].get_copy()
      }
      return obj
    }
    // we sould never need a copy of inputs and outputs and they have to never change, never be touched
    return new Network(this.#input_nodes, this.#output_nodes, deep_copy(this.#hidden_nodes), deep_copy(this.#connections))
  }

  get_candidate_connection() {
    let size = Object.keys(this.#available_connections).length
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
    if (this.#connections[connection_innov].is_enabled()) {
      this.#disabled_connections++
      this.#connections[connection_innov].disable()
    }
  }

  get_fitness() {
    return this.#fitness
  }

  mutate_weight() {
    const random_connection = this.get_random_connection()
    if (random_connection !== undefined) {
      this.#connections[random_connection].change_weight()
    }
  }

  add_node(node, rearrange = true) {
    if (this.#hidden_nodes[node.get_id()] === undefined) {
      this.#hidden_nodes[node.get_id()] = node.get_copy()
      this.#n++
      if (rearrange) {
        this.#update_insights()
      }
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
        if (!this.#connections[conn.innov].is_enabled()) {
          this.#disabled_connections++
        }
        if (this.#connection_set[conn.from] === undefined) {
          this.#connection_set[conn.from] = []
        }
        this.#connection_set[conn.from].push(conn.to)
        return this.#connections[conn.innov]
      }
    }
    return undefined
  }

  // TODO TODO TODO
  // think function executes the thinking process and returns output values
  think() {

  }
}

