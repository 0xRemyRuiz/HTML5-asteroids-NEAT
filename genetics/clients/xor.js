
import {Population} from '../neat/population.js'
import {config} from '../neat/neat.js'

// Algorithm
//-Step0 Start from gen 0 (from static config)
// create node(0, input) then node(1, input) finally node(2, output)
// either start with full connection (0, 2) and (1, 2) or no connection at all
//-Step1 Generate population
//-Step2 Run through population
//-Step3 Cross over 20% best individuals then mutate offspring
//-Step4 Increase generation counter and set aside best fitness score then go to Step2

var test_data = {
  specie: 'aba',
  nodes: {
    0: {id: 0, layer: 0, innov: 0},
    1: {id: 1, layer: 0, innov: 0},
    4: {id: 4, layer: 2, innov: 2},
    5: {id: 5, layer: 2, innov: 0},
    2: {id: 2, layer: 1, innov: 3},
  },
  connections: [
    {from: 0, to: 5, innov: 2, enabled: false, weight: 0.9},
    {from: 0, to: 2, innov: 1, enabled: true, weight: 1.1},
    {from: 4, to: 2, innov: 1, enabled: true, weight: 1.5},
    {from: 5, to: 2, innov: 3, enabled: false, weight: 0.2},
    {from: 4, to: 0, innov: 3, enabled: true, weight: 0.2},
  ],
  layers: [
    [0, 1],
    [4, 5],
    [2],
  ],
}

const assign_idx = (current_game, ws) => {
  for (const k in current_game.available_individuals) {
    ws.assigned_individual_idx = current_game.available_individuals[k]
    delete current_game.available_individuals[k]
    return true
  }
  if (current_game.pop_idx < current_game.population.length) {
    ws.assigned_individual_idx = current_game.pop_idx++
  } else {
    return false
  }
  return true
}

const init_population = (current_game) => {


  // return

  current_game.population = []
  for (var i = 0; i < 5; i++) {
    // TEST: random here replaces the NN behavior
    current_game.population[i] = {
      neural_process: () => Math.floor(Math.random() * 2),
      // TEST: fixed dummy phenotype
      phenotype: {...test_data},
      finalFitness: null,
    }
  }
  current_game.pop_idx = 0
  current_game.number_finished_game = 0
}

export default (current_game, ws, object) => {
  // initialize hack
  if (ws === null) {
    // current_game.population = new Population()
    // return
    current_game.generation_number = 0
    init_population(current_game)
    return
  }

  if (current_game.status === 'running'
    && current_game.pop_idx === current_game.population.length) {
    let no_individual = true
    for (let k in current_game.available_individuals) {no_individual = false}

    if (no_individual) {
      // TODO: parse through final fitness score then process to breed new generation
      current_game.generation_number++
      init_population(current_game)
    }
  }

  if (current_game.status === 'running') {
    if (object.msg === 'game') {
      if (assign_idx(current_game, ws)) {
        ws.send(JSON.stringify({
          msg: 'restart', game: 'xor',
          phenotype: current_game.population[ws.assigned_individual_idx].phenotype
        }))
      }

    } else if (object.status === 'round check' && object.inputs) {
      const res = current_game.population[ws.assigned_individual_idx].neural_process(object.inputs)
      ws.send(JSON.stringify({ result: res }))

    } else if (object.status === 'finished') {
      const fitness = object.fitness
      current_game.number_finished_game++
      current_game.population[ws.assigned_individual_idx].finalFitness = fitness

      if (current_game.best_fitness_score === null || current_game.best_fitness_score < fitness) {
        current_game.best_fitness_score = fitness
      }

      if (assign_idx(current_game, ws)) {
        ws.send(JSON.stringify({
          msg: 'restart', game: 'xor',
          phenotype: current_game.population[ws.assigned_individual_idx].phenotype
        }))
      }
    }
  }
}

