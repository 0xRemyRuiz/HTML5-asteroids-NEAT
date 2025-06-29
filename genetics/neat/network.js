import Node from './node.js'
import Connection from './connection.js'

import prng from '../libs/prng.js'

export default class Network {
  /*
   * Internal properties
   */
  #feed_forward = true
  #input_nodes
  #output_nodes
  #hidden_nodes = {}
  #nodes = {}
  #specie
  // n is the total number of hidden nodes
  #n = 0
  #connections = {}
  // c is the total number of connections
  #c = 0
  #disabled_connections = 0
  // hashmap to keep values before being computed
  #compute_values = {}
  #fitness = 0
  // the adjusted fitness should be mitigated by f′ = fi / ∑(n, j=1)(sh(δ(i, j))
  // the reality is that is extremely computationally intensive and is very near a simple f′ = fi / N
  // N being the total number of members in a given population after speciation
  #adjusted_fitness = 0

  // insights
  // topologically sorted nodes
  #sorted_nodes = []
  // layers computed from sorted nodes
  #layers = []
  // simple connection hash map for fast check (like a dict of array in python)
  #connection_set = {}
  #incoming_connections = {}
  // available connections computed from layers
  #available_connections = {}

  /*
   * Private methods
   */
  #add_new_connection(connection) {
    const conn = connection.get()
    this.#connections[conn.innov] = connection
    this.#c++

    if (!this.#connections[conn.innov].is_enabled()) {
      this.#disabled_connections++
    }

    if (this.#connection_set[conn.from] === undefined) {
      this.#connection_set[conn.from] = []
    }
    this.#connection_set[conn.from].push(conn.to)

    if (this.#incoming_connections[conn.to] === undefined) {
      // TODO: check if Set is better here than an array
      this.#incoming_connections[conn.to] = new Set()
    }
    this.#incoming_connections[conn.to].add(conn.innov)

    return this.#connections[conn.innov]
  }

  /*
   * Public methods
   */
  constructor(inputs, outputs, hidden_nodes, connections) {
    this.#input_nodes = inputs
    this.#output_nodes = outputs
    for (let k in hidden_nodes) {
      this.#hidden_nodes[k] = hidden_nodes[k].get_copy()
      this.#n++
    }
    for (let k in connections) {
      this.#add_new_connection(connections[k].get_copy())
    }
    // topologically sort the nodes then generate layers then generate available connection hash map
    this.update_insights()
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
    // const m = this.#input_nodes.length + this.#output_nodes.length
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
  get_resume() {
    return {
      fitness: this.#fitness,
      adjusted_fitness: this.#adjusted_fitness,
    }
  }
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
      layers: this.#layers,
      connection_set: this.#connection_set,
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

  get_all_hidden_nodes() {
    return this.#hidden_nodes
  }

  get_all_connections_with_weight() {
    const res = []
    for (let k in this.#connections) {
      res.push({ innov: this.#connections[k].get_innov(), weight: this.#connections[k].get_weight() })
    }
    return res.sort((a, b) => a.innov - b.innov)
  }

  get_candidate_connection() {
    let size = Object.keys(this.#available_connections).length
    if (size === 0) {
      return undefined
    }
    let rnd_countdown = Math.floor(prng.do.random() * size)
    for (let from in this.#available_connections) {
      if (rnd_countdown <= 0) {
        return [from, Math.floor(prng.do.random() * this.#available_connections[from].length)]
      }
      rnd_countdown--
    }
    return undefined
  }

  get_random_connection() {
    if (this.#c > 0) {
      let rnd = Math.floor(prng.do.random() * (this.#c - this.#disabled_connections))
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
      let rnd = Math.floor(prng.do.random() * this.#n)
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

  get_adjusted_fitness() {
    return this.#adjusted_fitness
  }

  set_adjusted_fitness(specie_size) {
    this.#adjusted_fitness = this.#fitness / specie_size
    return this.#adjusted_fitness
  }

  get_specie() {
    return this.#specie
  }

  set_specie(specie) {
    this.#specie = specie
  }

  mutate_weight() {
    const random_connection = this.get_random_connection()
    if (random_connection !== undefined) {
      random_connection.change_weight()
    }
  }

  add_node(node, parent_conn, conn_from, conn_to) {
    const node_id = node.get_id()
    if (this.#hidden_nodes[node_id] === undefined) {
      this.#hidden_nodes[node_id] = node.get_copy()
      this.#n++
      this.disable_connection_by_innov(parent_conn.innov)
      // create first connection with weight = 1
      this.#add_new_connection(conn_from)
      // create second connection with the weight from the old connection
      this.#add_new_connection(conn_to)
      this.update_insights()
      return true
    }
    return false
  }

  add_connection(connection) {
    const conn = connection.get()
    const available_conn = this.#available_connections[conn.from]
    if (available_conn !== undefined && this.#connections[conn.innov] === undefined) {
      const idx = available_conn.indexOf(conn.to)
      if (idx !== -1) {
        // removing the connection from the array of available ones
        this.#available_connections[conn.from].splice(idx, 1)
        const new_connection = this.#add_new_connection(connection.get_copy())
        this.update_insights()
        return new_connection
      }
    }
    return undefined
  }

  get_connection(innov) {
    return this.#connections[innov]
  }

  get_node(id) {
    return this.#hidden_nodes[id]
  }

  number_of_severed_node() {
    let total_number_of_severed_nodes = 0

    const adjacency = {}
    for (let k in this.#connections) {
      const conn = this.#connections[k].get()
      if (adjacency[conn.from] === undefined) {
        adjacency[conn.from] = []
      }
      adjacency[conn.from].push(parseInt(conn.to))
    }

    const visited = new Set()
    const dfs = (node_id) => {
      node_id = parseInt(node_id)
      if (visited.has(node_id)) {
        return
      }

      visited.add(node_id)
      let has_connection = false
      for (let k in adjacency[node_id]) {
        dfs(adjacency[node_id][k])
        has_connection = true
      }

      if (!has_connection && this.#nodes[node_id].get_type() !== 'output') {
        total_number_of_severed_nodes++
      }
    }

    for (let k in this.#input_nodes) {
      dfs(this.#input_nodes[k].get_id())
    }

    return total_number_of_severed_nodes
  }

  update_insights() {
    // 
    // STEP 1
    // topologically sort nodes based on connections
    const adjacency = {}
    for (let k in this.#connections) {
      const conn = this.#connections[k].get()
      if (adjacency[conn.from] === undefined) {
        adjacency[conn.from] = []
      }
      adjacency[conn.from].push(parseInt(conn.to))
    }

    const visited = new Set()
    this.#sorted_nodes = []
    const dfs = (node_id) => {
      node_id = parseInt(node_id)
      if (visited.has(node_id)) {
        return
      }
      visited.add(node_id)
      for (let k in adjacency[node_id]) {
        dfs(adjacency[node_id][k])
      }
      this.#sorted_nodes.unshift(node_id)
    }

    for (let k in this.#input_nodes) {
      dfs(this.#input_nodes[k].get_id())
    }

    // 
    // STEP 2
    // once the topological order has been computed, we compute per layer order (layers is an array of arrays)
    const node_to_layer = {}
    const tmp_layers = {}
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

      if (!tmp_layers[layer]) {
        tmp_layers[layer] = []
      }
      tmp_layers[layer].push(node_id)
    }

    // Convert layers object to ordered array
    // this sh*t below has been AI generated (chatGPT 05/2025)
    // const result = [];
    // const sortedLayerIndices = Object.keys(layers).map(Number).sort((a, b) => a - b);
    // for (const index of sortedLayerIndices) {
    //   result.push(tmp_layers[index]);
    // }

    // console.log("BEFORE LAYERS", this.#layers)
    this.#layers = []
    // add input nodes add layer 0
    this.#layers.push(Object.keys(this.#input_nodes).map((s) => parseInt(s)))
    // add hidden nodes
    let idx = 0
    for (let k in tmp_layers) {
      if (idx !== 0) {
        // skip index zero, we add input nodes afterward since they could be not connected
        this.#layers.push(tmp_layers[idx.toString()])
      }
      idx++
    }
    // add output nodes add the end
    this.#layers.push(Object.keys(this.#output_nodes).map((s) => parseInt(s)))
    // console.log("AFTER LAYERS", this.#layers)

    // 
    // STEP 3
    // now that layers have been computed we compute available connections list (hash map, or dict of arrays in python)
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

    this.#nodes = {}
    Object.assign(this.#nodes, this.#input_nodes)
    Object.assign(this.#nodes, this.#hidden_nodes)
    Object.assign(this.#nodes, this.#output_nodes)
  }

  // think function executes the thinking process and returns output values
  think(inputs) {
    const output = []
    const l = this.#sorted_nodes.length
    for (let i = 0; i < l; i++) {
      const node = this.#nodes[this.#sorted_nodes[i]]
      if (node.get_type() === 'input') {
        continue
      }

      const incomings = this.#incoming_connections[this.#sorted_nodes[i]]
      if (incomings) {
        let current_value = 0
        incomings.forEach((conn) => {
          const connection = this.#connections[conn]
          if (connection.is_enabled()) {
            const origin_node = this.#nodes[connection.get_from()]
            if (origin_node.get_type() === 'input') {
              // the reference index is the node id - 1 because node 0 is always the bias node
              current_value += connection.get_weight() * inputs[origin_node.get_id() - 1]
            } else {
              current_value += connection.get_weight() * origin_node.value
            }
          }
        })
        node.activate(current_value)
        if (node.get_type() === 'output') {
          output.push(node.value > 0.5 ? 1 : 0)
        }
      }
    }

    return output
  }
}

