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

  toggle_enable() {
    this.#enabled = !this.#enabled
  }

  disable() {
    this.#enabled = false
  }

  is_enabled() {
    return !!this.#enabled
  }

  change_weight(weight = Math.random()) {
    this.#weight = weight
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

  get_copy() {
    return new Connection(this.#innov, this.#from, this.#to, this.#weight, this.#enabled)
  }

  get_weight() {
    return this.#weight
  }

  get_innov() {
    return this.#innov
  }
}