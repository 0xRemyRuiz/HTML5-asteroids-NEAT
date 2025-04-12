import Network, Node, Connection from './network'

export class Population {
  id = null
  nodes = Set()
  node_innovation_number = 0
  connections = Set()
  connection_innovation_number = 0

  constructor(id) {
    this.id = id
  }

  add_node(layer, activation) {
    if (this.nodes.has()) {
      return -1
    }
    this.nodes.add(new Node())
    // add i/o connection ?
  }

  add_connection(connection) {
    if (this.connections.has(connection)) {
      return -1
    }
  }
}
