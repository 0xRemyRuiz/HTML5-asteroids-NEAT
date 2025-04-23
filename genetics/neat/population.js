import Network, Node, Connection from './network'

export class Population {
  id = 0
  // we're not using javascript Set here because it has very limited capacity
  // instead we'll use an array as a hash map to store nodes
  nodes = []
  node_id_number = 0
  node_innovation_number = 0
  connections = []
  connection_innovation_number = 0
  networks = []

  constructor(id) {
    this.id = id
  }

  add_node(layer, activation, connection) {
    const new_node = new Node()
    if (this.nodes[new_node.get_id()] !== undefined) {
      return false
    }
    this.nodes[new_node.get_id()] = new_node
    return true
  }

  add_connection(connection) {
    if (this.connections[connection.get_id()] !== undefined) {
      return false
    }
    return true
  }

  
}
