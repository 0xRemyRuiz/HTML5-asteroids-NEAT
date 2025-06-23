import prng from '../libs/prng.js'

export default class Connection {
  /*
   * Internal properties
   */
  #innov
  #from
  #to
  #weight
  #enabled

  /*
   * Public methods
   */
  constructor(innov, from, to, weight = 1, enabled = true) {
    this.#innov = innov
    this.#from = from
    this.#to = to
    this.#weight = weight
    this.#enabled = enabled
  }

  get_copy() {
    return new Connection(this.#innov, this.#from, this.#to, this.#weight, this.#enabled)
  }

  get() {
    return {
      innov: this.#innov,
      from: parseInt(this.#from),
      to: parseInt(this.#to),
      weight: this.#weight,
      enabled: this.#enabled,
    }
  }

  get_innov() {
    return this.#innov
  }

  get_from() {
    return parseInt(this.#from)
  }

  get_to() {
    return parseInt(this.#to)
  }

  get_weight() {
    return this.#weight
  }

  is_enabled() {
    return !!this.#enabled
  }

  disable() {
    this.#enabled = false
  }

  change_weight() {
    // TODO: parametrize this
    this.#weight = prng.do.random() * (30 + 30) - 30
  }
}