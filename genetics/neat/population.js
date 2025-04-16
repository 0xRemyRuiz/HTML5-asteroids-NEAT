import Network, Node, Connection from './network'

export class Population {
  id = null
  // we're not using javascript Set here because it has very limited capacity
  // instead we'll use an array as a hash map to store nodes
  nodes = []
  node_id_number = 0
  connections = []
  connection_innovation_number = 0

  constructor(id) {
    this.id = id
  }

  add_node(layer, activation) {
    const new_node = new Node()
    if (this.nodes[new_node.get_id()] !== undefined) {
      return -1
    }
    this.nodes[new_node.get_id()] = new_node
    // add i/o connection ?
  }

  add_connection(connection) {
    if (this.connections[connection.get_id()] !== undefined) {
      return -1
    }
  }
}
