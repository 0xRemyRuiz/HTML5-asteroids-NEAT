
export class Node {
  activation = null
  innov = 0

  constructor(activation, innov) {
    this.innov = innov
  }
}

export class Connection {
  from = null
  to = null
  enabled = true
  weight = 0.0
  innov = 0

  constructor(from, to, innov) {
    this.from = from
    this.to = to
    this.innov = innov
  }
}

export class Network {
  layers = []
  connections = []

  constructor() {
    
  }

  add_node() {
    
  }
}

