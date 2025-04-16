
export class Node {
  // id is the unique identifier of the node, it won't change
  id = 0
  // layer 0 is input, layer -1 is output and all the layers in between are hidden nodes layers
  layer = 0
  activation_name = null
  activation_func = null
  // innov the innovation value based on how recent the node is and/or the activation mutation
  innov = 0

  constructor(id, layer, activation_name, activation_func) {
    this.id = id
    this.layer = layer
    this.activation_name = activation_name
    this.activation_func = activation_func
  }

  activate(inputs) {
    // TODO: maybe change this to be a parametric agreggation function
    let sum = 0
    for (const i in inputs) {
      sum += inputs[i]
    }
    return this.activation_func(sum)
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

  constructor(specie, nodes, connections) {
    this.specie = specie
    this.nodes = nodes
    this.connections = connections
  }

  get_random_connection() {

  }

  get_random_node() {

  }

  add_node(connection) {
    
  }

  add_connection(from, to) {
    
  }
}

