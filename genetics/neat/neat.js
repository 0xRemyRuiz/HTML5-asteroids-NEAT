//  N/A cf. medium.com/@eugenesh4work/how-to-solve-games-with-genetic-algorithms-building-an-advanced-neuroevolution-solution-71c1817e0bf2
//      cf. github.com/chuanhao01/Javascript_NEAT

//      cf. medium.com/@nirajsawant2313/a-simple-ai-using-neat-neuroevolution-of-augmenting-topologies-ae1b7d8f4a5e
//      cf. https://medium.com/data-science/https-medium-com-piotr-skalski92-deep-dive-into-deep-networks-math-17660bc376ba
//  !!! cf. https://blog.lunatech.com/posts/2024-02-29-the-neat-algorithm-evolving-neural-network-topologies
// !!!! cf. https://www.youtube.com/watch?v=yVtdp1kF0I4
//   !! cf. https://www.youtube.com/watch?v=vf18FLdKkY4
// !!!! cf. https://dev.to/jbahire/demystifying-the-xor-problem-1blk
//    ! cf. https://www.youtube.com/watch?v=KiW-W4v0nBo
//  !!! cf. https://www.youtube.com/watch?v=6ym3tTzPSUQ

// Example neat configuration to get inspiration from
// based on cf. https://neat-python.readthedocs.io/en/latest/xor_example.html
const NEAT_config = {
  //- NEAT
  'fitness_criterion'     : 'max',
  'fitness_threshold'     : 3.9,
  'pop_size'              : 150,
  'reset_on_extinction'   : false,

  //- DefaultGenome
  // node activation options
  'activation_default'      : 'sigmoid',
  'activation_mutate_rate'  : 0.0,
  'activation_options'      : 'sigmoid',

  // node aggregation options
  'aggregation_default'     : 'sum',
  'aggregation_mutate_rate' : 0.0,
  'aggregation_options'     : 'sum',

  // node bias options
  'bias_init_mean'          : 0.0,
  'bias_init_stdev'         : 1.0,
  'bias_max_value'          : 30.0,
  'bias_min_value'          : -30.0,
  'bias_mutate_power'       : 0.5,
  'bias_mutate_rate'        : 0.7,
  'bias_replace_rate'       : 0.1,

  // genome compatibility options
  'compatibility_disjoint_coefficient' : 1.0,
  'compatibility_weight_coefficient'   : 0.5,

  // connection add/remove rates
  'conn_add_prob'           : 0.5,
  'conn_delete_prob'        : 0.5,

  // connection enable options
  'enabled_default'         : true,
  'enabled_mutate_rate'     : 0.01,

  'feed_forward'            : true,
  'initial_connection'      : 'full',

  // node add/remove rates
  'node_add_prob'           : 0.2,
  'node_delete_prob'        : 0.2,

  // network parameters
  'num_hidden'              : 0,
  'num_inputs'              : 2,
  'num_outputs'             : 1,

  // node response options
  'response_init_mean'      : 1.0,
  'response_init_stdev'     : 0.0,
  'response_max_value'      : 30.0,
  'response_min_value'      : -30.0,
  'response_mutate_power'   : 0.0,
  'response_mutate_rate'    : 0.0,
  'response_replace_rate'   : 0.0,

  // connection weight options
  'weight_init_mean'        : 0.0,
  'weight_init_stdev'       : 1.0,
  'weight_max_value'        : 30,
  'weight_min_value'        : -30,
  'weight_mutate_power'     : 0.5,
  'weight_mutate_rate'      : 0.8,
  'weight_replace_rate'     : 0.1,

  //- DefaultSpeciesSet
  'compatibility_threshold' : 3.0,

  //- DefaultStagnation
  'species_fitness_func' : 'max',
  'max_stagnation'       : 20,
  'species_elitism'      : 2,

  //- DefaultReproduction
  'elitism'            : 2,
  'survival_threshold' : 0.2,
}

/**
 * 
 * Activation functions
 * 
 **/
// Partially derived from neat python documentation
// cf. https://neat-python.readthedocs.io/en/latest/activation.html
// Also base verification from https://en.wikipedia.org/wiki/Activation_function
export const activation = {
  'ident': function(x) {
    return x
  },
  'abs': function(x) {
    return Math.abs(x)
  },
  'square': function(x) {
    return x * x
  },
  'cube': function(x) {
    return x * x * x
  },
  'hat': function(x) {
    return Math.max(1 - Math.abs(x), 0)
  },
  'gauss': function(x) {
    return Math.exp(-(x * x))
  },
  'relu': function(x) {
    if (x <= 0) return 0
    return x
  },
  'lrelu': function(x) {
    const alpha = 0.1
    if (x <= 0) return alpha * x
    return x
  },
  'elu': function(x) {
    if (x > 0) return x
    return Math.exp(x) - 1
  },
  // cf. https://github.com/pytorch/pytorch/blob/96aaa311c0251d24decb9dc5da4957b7c590af6f/torch/nn/modules/activation.py#L422
  'selu': function(x) {
    if (x > 0) return x
    const alpha = 1.6732632423543772848170429916717
    const scale = 1.0507009873554804934193349852946
    return alpha * scale * (Math.exp(x) - 1)
  },
  'silu': function(x) {
    return x / (1 + Math.exp(-x))
  },
  'elish': function(x) {
    if (x < 0) return (Math.exp(x) - 1) / (1 + Math.exp(-x))
    return x / (1 + Math.exp(-x))
  },
  'exp': function(x) {
    return Math.exp(x)
  },
  'softplus': function(x) {
    return Math.log(1 + Math.exp(x))
  },
  'sin': function(x) {
    return Math.sin(x)
  },
  'invers': function(x) {
    return 1 / x
  },
  'log': function(x) {
    return Math.log(x)
  },
  'clamp': function(x) {
    if (x > 1.0) return 1.0
    if (x < -1.0) return -1.0
    return x 
  },
  'tanh': function(x) {
    return (Math.exp(x) - Math.exp(-x)) / (Math.exp(x) + Math.exp(-x))
  },
  'sigmoid': function(x) {
    return 1 / (1 + Math.exp(-x))
  },
}

/**
 * 
 * Default NEAT configuration
 *
 **/
export const config = {
  'mutation_rate': 0.7,
  'major_mutation_rate': 0.1,
  'activation_options': ['sigmoid'],
  'speciation_shield': 3,
}

export const update_config = (obj) => {
  if (typeof obj === 'object') {
    config = {...config, ...obj}
  } else {
    console.warn('Warning: update_config function needs an object as argument!')
  }
}
