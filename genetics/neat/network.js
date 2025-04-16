
export class Node {
  // id is the unique identifier of the node, it won't change
  id = 0
  // layer 0 is input, layer -1 is output and all the layers in between are hidden nodes layers
  layer = null
  activation_name = null
  activation_func = null
  // innov the innovation value based on how recent the node is and/or the activation mutation
  innov = 0
  // used to store inputs
  inputs = []

  constructor(id, innov, activation_name, activation_func) {
    this.id = id
    this.innov = innov
    this.activation_name = activation_name
    this.activation_func = activation_func
  }

  set_layer(layer) {
    this.layer = layer
  }

  accumulate(input) {
    // used to accumulate inputs until neuron gets activated
    this.inputs.append(input)
  }

  activate() {
    // TODO: maybe change this to be a parametric agreggation function
    let sum = 0
    for (const i in this.inputs) {
      sum += this.inputs[i]
    }
    return this.activation_func(sum)
  }

  copy() {
    // pass over a copy of this node
    return new Node(this.id, this.innov, this.activation_name, this.activation_func)
  }

  get_id() {
    return id+'-'+layer+'-'+innov
  }
}

export class Connection {
  from = null
  to = null
  innov = 0

  enabled = true
  weight = 0.0

  constructor(from, to, innov) {
    this.from = from
    this.to = to
    this.innov = innov
  }

  get_id() {
    return from+'-'+to+'-'+innov
  }
}

export class Network {
  specie = null
  nodes = []
  connections = []
  layers = []

  constructor(specie, nodes, connections) {
    this.specie = specie
    this.nodes = nodes
    this.connections = connections
  }

  get_random_connection() {
    return this.connections[Math.random() * this.connections.length - 1]
  }

  get_random_node() {
    return this.nodes[Math.random() * this.nodes.length - 1]
  }

  add_node(connection) {
    
  }

  add_connection(from, to) {

  }
}

