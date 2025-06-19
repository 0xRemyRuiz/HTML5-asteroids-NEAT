import {config, activation} from './neat.js'

import Network from './network.js'
import Node from './node.js'
import Connection from './connection.js'

// TODO: eventually refactor and globalize this utility function
// check function has similar behavior than compareFn from sort builtin function
// ascending order : check = (arr, idx, el) => arr[idx] - el or (arr, idx, el) => arr[idx] > el
// descending order : check = (arr, idx, el) => el - arr[idx] or (arr, idx, el) => arr[idx] < el
function insert_into(arr, el, check) {
  let mid, l = 0, h = arr.length - 1
  if (check(arr, h, el) <= 0) {
    arr.push(el)
    return h + 1
  } else if (check(arr, l, el) > 0) {
    arr.splice(l, 0, el)
    return 0
  }
  while (l < h) {
    mid = Math.round((h - l) / 2) + l
    if (check(arr, mid, el) > 0) {
      h = mid - 1
    } else {
      l = mid
    }
  }
  arr.splice(mid, 0, el)
  return mid
}

// this function returns an array containing probabilites to be run against Math.random()
// this allows to increase the probability to get the first elements of the array
function log_distribution(length) {
  const proba = [];
  let total = 0;
  for (let i = 0; i < length; i++) {
    const score = 1 / Math.log(i + 2); // Avoid log(1)
    total += score;
    proba.push(total);
  }
  for (let i = 0; i < proba.length; i++) {
    proba[i] /= total;
  }
  return proba
}

// (function() {
//   const check = (arr, idx, el) => arr[idx] - el
//   console.log(insert_into([1,3], 2, check) == 1)
//   console.log(insert_into([1,3,4], 0, check) == 0)
//   console.log(insert_into([1,3,4,5,7,8,10,14,15,18,19], 9, check) == 6)
//   console.log(insert_into([1,3,4,5,7,8,9,10,14,15,18,19], 9, check) == 7)
//   console.log(insert_into([1,3,4,5,7,8,9,9,9,10,14,15,18,19], 9, check) == 9)
//   console.log(insert_into([1,3,4,5,7,8,9,10,14,15,18,19], 2, check) == 1)
//   console.log(insert_into([1,1,1,1,2,2,2,2,3,3,4,5,6,7], 2, check) == 8)
//   console.log(insert_into([1,2,3], 4, check) == 3)
//   console.log(insert_into([1,2,3,5], 4, check) == 3)
//   console.log(insert_into([1,2,3,4], 4, check) == 4)
// })()


export default class Population {
  /*
   * Internal properties
   */
  // we're not using javascript Set here because it has very limited capacity
  // instead we'll use a hash maps to store nodes
  // also, input and output nodes has to be immutable
  #input_nodes = {}
  #output_nodes = {}
  // m is the total number of input and output nodes
  #m = 0
  #node_uid = 0
  #nodes = {}
  // parents are a list of acenstry updated when a connection is split in two and a node created
  #parents = {}
  #connection_innovation_number = 0
  #connections = {}
  #networks = []
  #current_total_fitness = 0
  #current_best_fitness = 0
  #current_worst_fitness = 0
  #species = []
  #specie_id = 0
  #pop_size

  /*
   * Private methods
   */
  #create_new_connection(from, to, weight = 1) {
    for (let k in this.#connections) {
      const conn = this.#connections[k].get()
      if (conn.from === from && conn.to === to) {
        // if such connection already exists, return the connection
        return conn
      }
    }
    // else create a new connection and increment the innovation number
    const new_connection = new Connection(this.#connection_innovation_number, from, to, weight)
    this.#connections[this.#connection_innovation_number] = new_connection
    this.#connection_innovation_number++
    return new_connection
  }

  #mutate_network_by_id(network_idx) {
    // TODO: parametrize from config  'mutation_chance'
    if (Math.random() <= 1) {
      // TODO: parametrize from config  'mutation_rates': [0.5, 0.3, 0.2],
      const curr_network = this.#networks[network_idx]

      // CONNECTION MUTATE
      if (Math.random() <= 0.6) {
        curr_network.mutate_weight()
      }

      // CONNECTION ADD
      if (Math.random() <= 0.4) {
        // TOOD: check if bias should be included here or only below
        // mutate connection add
        const candidate_connection = curr_network.get_candidate_connection()
        // did we find a viable candidate?
        if (candidate_connection !== undefined) {
          // TODO: maybe parametrize the random weight selection
          curr_network.add_connection(this.#create_new_connection(candidate_connection[0], candidate_connection[1], Math.random()))
        }
      }

      /* From NEAT 2nd paper
         -------------------
         "The old connection is disabled and two new connections are added to the genome.
          The new connection leading into the new node receives a weight of 1, and the new
          connection leading out receives the same weight as the old connection."
       */
      // NOTE: in this algorithimic order, a freshly created connection might get immediately split, it's an expected behavior
      // NODE ADD
      if (Math.random() <= 0.2) {
        // TODO: try to refactor here
        const candidate_connection = curr_network.get_random_connection()
        // if there is at least one viable candidate to be split
        if (candidate_connection !== undefined) {
          // create the node
          const parent_conn = candidate_connection.get()
          const new_node_id = this.create_new_node('sigmoid', 'hidden', parent_conn.innov)

          // create first connection with weight = 1
          const conn1 = this.#create_new_connection(parent_conn.from, new_node_id)
          // create second connection with the weight from the old connection
          const conn2 = this.#create_new_connection(new_node_id, parent_conn.to, parent_conn.weight)
          curr_network.add_node(this.#nodes[new_node_id], parent_conn, conn1, conn2)
        }
      }

      // MUTATE node function

      // don't forget to update the helper elements
      curr_network.update_insights()
    }
  }

  #create_new_specie(representative) {
    representative.set_specie(this.#specie_id)
    this.#species.push({
      id: this.#specie_id,
      // TODO: parametrize this
      stagnation_countdown: 3 + 1,
      best_fitness: representative.get_fitness(),
      members: [representative],
      representative: representative,
    })
    this.#specie_id++
  }

  #calculate_delta(base, target) {
    // TODO: parametrize this
    const c1 = 1, c2 = 1, c3 = 0.4
    let net1, net2
    if (base[base.length - 1].innov > target[target.length - 1].innov) {
      net1 = target; net2 = base
    } else {
      net1 = base; net2 = target
    }
    const net1len = net1.length, net2len = net2.length
    let D = 0, i = 0, j = 0, c = 0, w = 0
    while (i < net1len && j < net2len) {
      if (net1[i].innov == net2[j].innov) {
        // common genes
        w += Math.abs(net1[i].weight - net2[j].weight)
        c++; i++; j++; continue
      } else if (net1[i].innov < net2[j].innov) {
        i++
      } else {
        j++
      }
      // disjoint genes
      D++
    }
    // W is the average differences of common genes weight
    const W = w / c
    // excess genes
    const E = Math.abs(net1len - net2len) + Math.abs(i - j)
    // the N factor cannot be the max number of genes in either genomes as paper says, it doesn't make any sense
    // const N = net1len > net2len ? net1len : net2len

    // final calculation
    // return (c1 * E) / N + (c2 * D) / N + c3 * W
    return c1 * E + c2 * D + c3 * W
  }

  #speciate(network, network_fitness) {
    const base = network.get_all_connections_with_weight()
    for (let k in this.#species) {
      const specie = this.#species[k]
      const target = specie.representative.get_all_connections_with_weight()
      // this doesn't work, for whatever reason they are not the same reference...oh javascript...
      if (base == target) {
        continue
      }
      if (this.#calculate_delta(base, target) < 3) {
        // if current fitness of the network is better, reset stagnation countdown
        if (specie.best_fitness < network_fitness) {
          specie.best_fitness = network_fitness
          // TODO: parametrize this
          specie.stagnation_countdown = 3 + 1
        }
        network.set_specie(specie.id)
        // sort in descending order, index 0 should have the highest fitness
        if (specie.members.length === 0) {
          specie.members.push(network)
          return
        }
        insert_into(specie.members, network, (a, i, net) => a[i].get_fitness() - net.get_fitness())
        // we have found a matching specie
        return
      }
    }
    // did not found specie? create another one!
    this.#create_new_specie(network)
  }

  #reproduce(parent1, parent2, decimal_check = 1) {
    // local utility functions
    function get_rand(e1, e2) {
      return Math.random() * 2 < 1 ? e1 : e2
    }
    // there is a huge side effect out of setting nodes from connection gene
    // it's that later genes crush the earlier ones, I'm not sure of the impact of this innovation
    function set_gene_with_nodes(connections, hidden_nodes, parent_object, innov) {
      const connection = parent_object.p.get_connection(innov)
      const conn = connection.get()
      const from_id = conn.from, to_id = conn.to
      const addon_connections = {}, addon_hidden_nodes = {}
      addon_connections[conn.innov] = connection
      if (parent_object.hn[from_id]) {
        addon_hidden_nodes[parent_object.hn[from_id].get().id] = parent_object.hn[from_id]
      }
      if (parent_object.hn[to_id]) {
        addon_hidden_nodes[parent_object.hn[to_id].get().id] = parent_object.hn[to_id]
      }
      Object.assign(connections, addon_connections)
      Object.assign(hidden_nodes, addon_hidden_nodes)
    }

    if (parent1 == undefined || parent2 == undefined)
      console.warn('reproduce() -> parent '+(parent1 == undefined ? '1' : '2')+' is undefined, fallback to asexual reproduction')
    // asexual reproduction
    if (parent1 === parent2) {
      return parent1.get_copy()
    }

    // sexual reproduction
    let p1 = parent1, p2 = parent2
    let nc1 = p1.get_all_connections_with_weight(), nc2 = p2.get_all_connections_with_weight()
    // swap objects if necessary so that parent1 is always the one with the smallest number of connections
    if (nc1[nc1.length - 1].innov > nc2[nc2.length - 1].innov) {
      [p1, nc1, p2, nc2] = [p2, nc2, p1, nc1]
    }
    const l1 = nc1.length, l2 = nc2.length
    const hn1 = p1.get_all_hidden_nodes(), hn2 = p2.get_all_hidden_nodes()
    // we use normalized fitness so we compare only the highest decimals
    // this is used to avoid comparisons like 12345678 != 12345679
    const normalized_fitness1 = Math.round(p1.get_fitness() / decimal_check)
    const normalized_fitness2 = Math.round(p2.get_fitness() / decimal_check)
    const connections = {}, hidden_nodes = {}

    // if fitness of both is comparable, offspring is a perfect merge of both
    if (normalized_fitness1 === normalized_fitness2) {
      // disjoints and common genes
      let i = 0, j = 0
      while (i < l1 && j < l2) {
        if (nc1[i].innov === nc2[j].innov) {
          const random_parent = get_rand({p: p1, hn: hn1}, {p: p2, hn: hn2})
          set_gene_with_nodes(connections, hidden_nodes, random_parent, nc1[i].innov)
          i++; j++
        } else if (nc1[i].innov < nc2[j].innov) {
          set_gene_with_nodes(connections, hidden_nodes, {p: p1, hn: hn1}, nc1[i].innov)
          i++
        } else {
          set_gene_with_nodes(connections, hidden_nodes, {p: p2, hn: hn2}, nc2[j].innov)
          j++
        }
      }

      // excess genes
      if (l1 !== l2) {
        if (l1 > l2) {
          while (i < l1) {
            set_gene_with_nodes(connections, hidden_nodes, {p: p1, hn: hn1}, nc1[i].innov)
            i++
          }
        } else {
          while (j < l2) {
            set_gene_with_nodes(connections, hidden_nodes, {p: p2, hn: hn2}, nc2[i].innov)
            j++
          }
        }
      }

    // if network1 is more fit, we inherit all from it
    } else if (normalized_fitness1 > normalized_fitness2) {
      for (let i = 0; i < l1; i++) {
        set_gene_with_nodes(connections, hidden_nodes, {p: p1, hn: hn1}, nc1[i].innov)
        i++
      }

    // else it's network2 we inherit all from
    } else {
      for (let j = 0; j < l2; j++) {
        set_gene_with_nodes(connections, hidden_nodes, {p: p2, hn: hn2}, nc2[j].innov)
        j++
      }
    }

    return new Network(this.#input_nodes, this.#output_nodes, hidden_nodes, connections)
  }

  /*
   * Public methods
   */
  constructor(pop_size = 15) {
    // TODO: parametrize this
    this.#pop_size = pop_size
    this.#input_nodes[this.#node_uid] = new Node(this.#node_uid, 'ident', activation['ident'], 'bias')
    this.#m++
    this.#node_uid++
  }

  // DEBUG ONLY
  get_blob() {
    const get_thingy = (obj) => {
      const res = {}
      for (let k in obj) {
        res[k] = obj[k].get()
      }
      return res
    }
    return {
      input_nodes: get_thingy(this.#input_nodes),
      output_nodes: get_thingy(this.#output_nodes),
      m: this.#m,
      node_uid: this.#node_uid,
      nodes: get_thingy(this.#nodes),
      connection_innovation_number: this.#connection_innovation_number,
      connections: get_thingy(this.#connections),
      pop_size: this.#pop_size,
      num_networks: this.#networks.length,
      species: (() => {
        const res = {}
        for (let k in this.#species) {
          res[k] = ((members) => {
            const r = []
            for (let j in members) {
              r.push(j)
            }
            return r
          })(this.#species[k].members)
        }
        return res
      })(),
    }
  }

  // DEBUG ONLY
  test_speciation() {
    // TODO
  }

  test_mutation_on_network(network_idx) {
    this.#mutate_network_by_id(network_idx)
    return this.#networks[network_idx]
  }

  create_new_node(activation_name, type = 'hidden', parent = null) {
    // TODO: eventually ensure that input and output nodes can't be added after initialization
    // new_node here is a function as it acts as a generator, allocating the new_node only if needed and deduplicating code
    const new_node = () => new Node(this.#node_uid, activation_name, activation[activation_name], type, parent)
    const id = this.#node_uid

    if (type === 'hidden') {
      // if it is a hidden node, check parent connection to ensure uniqueness
      if (isNaN(parent)) {
        console.warn('Warning: Population.create_new_node method for hidden node requires a 3rd parameter parent of type number')
        return null

      }
      if (this.#parents[parent] === undefined) {
        this.#parents[parent] = this.#nodes[this.#node_uid]
        this.#nodes[this.#node_uid] = new_node()
      } else {
        return this.#parents[parent].get_id()
      }

    } else if (type === 'input') {
      this.#input_nodes[this.#node_uid] = new_node()
      this.#m++

    } else if (type === 'output') {
      this.#output_nodes[this.#node_uid] = new_node()
      this.#m++

    } else {
      return null
    }

    this.#node_uid++
    return id
  }

  initialize(adam = null) {
    if (adam === null) {
      const connections = {}
      // let's say, in NEAT, we have a starting individual (adam) with every input connected to every output
      for (let i in this.#input_nodes) {
        // skip bias node
        // i might be a string so a good check here is a lazy check
        if (i == 0) {
          continue
        }
        for (let o in this.#output_nodes) {
          const new_connection = this.#create_new_connection(i, o)
          connections[new_connection.get_innov()] = new_connection
        }
      }
      adam = new Network(this.#input_nodes, this.#output_nodes, {}, connections)
    }
    const rnd_network = Math.floor(Math.random() * this.#pop_size)
    const members = []
    for (let i = this.#pop_size - 1; i >= 0; i--) {
      // TODO: maybe improve this code
      const new_network = adam.get_copy()
      // add to the pool
      this.#networks.push(new_network)
      // mutate the network
      this.#mutate_network_by_id(this.#networks.length - 1)
      // add the new network to the original specie
      members.push(new_network)
      if (rnd_network === i) {
        // pick a random network and create specie from it
        this.#create_new_specie(this.#networks[this.#networks.length - 1])
      }
    }
    this.#species[0].members = members
  }

  breed_new_population() {
    // DEBUG
      const chain_mutate = (network_id, iteration) => {
        for (let i = 0; i < iteration; i++) {
          this.#mutate_network_by_id(network_id)
        }
      }
      for (let k in this.#networks) {
        // chain_mutate(k, 3)
        this.#networks[k].set_fitness(Math.random() * 50 + 1)
      }
    // !DEBUG

    const old_networks = this.#networks
    this.#networks = []
    // 2. (Re)Speciation
    for (let k in this.#species) {
      this.#species[k].members = []
    }
    this.#current_total_fitness = 0
    this.#current_best_fitness = 0
    this.#current_worst_fitness = Infinity
    // loop through current population, respeciating
    for (let k in old_networks) {
      const network_fitness = old_networks[k].get_fitness()
      this.#speciate(old_networks[k], network_fitness)
      this.#current_total_fitness += network_fitness
      if (network_fitness > this.#current_best_fitness) {
        this.#current_best_fitness = network_fitness
      }
      if (network_fitness < this.#current_worst_fitness) {
        this.#current_worst_fitness = network_fitness
      }
    }

    // 3. Remove stagnant species
    let global_adjusted_fitness = 0
    let current_total_networks = 0
    let removed_members = 0
    for (let i = 0; i < this.#species.length; i++) {
      const specie = this.#species[i]
      specie.stagnation_countdown--
      // TODO: parametrize minimum size of specie
      if (specie.stagnation_countdown > 0 && specie.members.length > 1) {
        // 4. Share fitness (explicit fitness sharing)
        specie.total_adjusted_fitness = 0
        // calculate adjusted fitness
        const N = specie.members.length
        for (let j in specie.members) {
          const adjusted_fitness = specie.members[j].set_adjusted_fitness(N)
          specie.total_adjusted_fitness += adjusted_fitness
          global_adjusted_fitness += adjusted_fitness
        }
        current_total_networks += N
        specie.best_fitness = specie.members[0].get_fitness()

      } else {
        removed_members += specie.members.length
        this.#species.splice(i, 1)
        i--
      }
    }

    // 5. Calculate offspring per species
    let total_pop_target = 0
    const target_pop_size = this.#pop_size
    for (let k in this.#species) {
      const specie = this.#species[k]
      // TODO: parametrize with elitism the (1 - 0.2) and check if it's mathematically correct
      const target = Math.floor((specie.total_adjusted_fitness / global_adjusted_fitness) * target_pop_size)
      specie.offspring_target = target
      total_pop_target += target
    }
    // DEBUG
      // const display_networks_fitz = (obj) => {
      //   for (let k in obj) {
      //     console.log('SPECIE '+k)
      //     const arr = obj[k].members        
      //     for (let i = 0; i < arr.length; i++) {
      //       console.log('NETWORK['+i+']=', arr[i].get_resume())
      //     }
      //   }
      // }
      // display_networks_fitz(this.#species)
    // -DEBUG
    // - sort species
    this.#species.sort((a, b) => a.members[0].get_adjusted_fitness() - b.members[0].get_adjusted_fitness())

    const per_specie_missing_offspring = Math.floor((this.#pop_size - total_pop_target) / this.#species.length)
    const remaining = (this.#pop_size - total_pop_target) % this.#species.length
    let current_pop = 0
    for (let i = this.#species.length - 1; i >= 0; i--) {
      const specie = this.#species[i]
      const elites = specie.members.slice(0, Math.floor(specie.members.length * 0.2))
      specie.offspring_target += per_specie_missing_offspring - elites.length
      current_pop += specie.offspring_target + elites.length
      // complement population using the best specie
      if (i === 0) {
        specie.offspring_target += this.#pop_size - current_pop
      }
      // TODO: parametrize the decimal check size
      const decimal_check = 10 ** Math.floor(Math.round(specie.members[0].get_fitness()).toString().length * 0.2)
      // select elites
      // 6. Elitism: preserve top genome from each species
      this.#networks = this.#networks.concat(elites)
      // reproduce and mutate candidates
      // 7. Reproduce: crossover or mutation
      const len = specie.members.length
      while (specie.offspring_target-- > 0) {
        const parent1 = specie.members[Math.floor(Math.random() * len)]
        const parent2 = specie.members[Math.floor(Math.random() * len)]
        this.#networks.push(this.#reproduce(parent1, parent2, decimal_check))
        this.#mutate_network_by_id(this.#networks.length - 1)
      }
    }
  }

  get_population_size() {
    return this.#networks.length
  }

  set_fitness(network_idx, fitness) {
    this.#networks[network_idx].set_fitness(fitness, this.#m)
  }

  get_phenotype(network_idx) {
    // Expected minimal structure of phenotype for visualization
    // {
    //   specie: 'stringExample',                                     // specie:        string
    //   nodes: {                                                     // nodes:         object
    //     0: {layer: 0},                                             // node:          object
    //     2: {layer: 1},
    //     1: {layer: 2},
    //   },
    //   connections: {                                               // connections:   object
    //     2: {from: 0, to: 2, innov: 2, enabled: true, weight: 1.2}, // connection:    object
    //     5: {from: 0, to: 1, innov: 5, enabled: false, weight: 0.7},
    //     3: {from: 2, to: 1, innov: 3, enabled: true, weight: 0.7},
    //   },
    //   sorted_nodes: [0, 1, 2]                                      // sorted_nodes:  array
    // }

    // const base_phenotype = this.#networks[network_idx].get_phenotype()
    // TODO: concat input+bias+genotype+output
    return this.#networks[network_idx].get_phenotype()
  }
}
