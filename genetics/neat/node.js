export default class Node {
  /*
   * Internal properties
   */
  #id
  #activation_name
  #activation_func
  #type
  // parent is the connection "parent" fom which is has been created, null means it either is an input or output node
  #parent

  /*
   * Public properties
   */
  // this is default but only really applicable to bias node
  value = 1

  /*
   * Public methods
   */
  constructor(id, activation_name, activation_func, type = 'hidden', parent = null) {
    this.#id = id
    this.#activation_name = activation_name
    this.#activation_func = activation_func
    this.#type = type
    this.#parent = parent
  }

  change_activation(activation_name, activation_func) {
    if (type === 'hidden') {
      this.#activation_name = activation_name
      this.#activation_func = activation_func
      return true
    }
    return false
  }

  get() {
    return {
      id: this.#id,
      activation_name: this.#activation_name,
      activation_func: this.#activation_func,
      parent: this.#parent,
      type: this.#type,
      value: this.value,
    }    
  }

  get_copy() {
    // pass over a copy of this node
    return new Node(this.#id, this.#activation_name, this.#activation_func, this.#type, this.#parent)
  }

  get_id() {
    return this.#id
  }

  get_activation_name() {
    return this.#activation_name
  }

  // neuron activation based on current public value
  activate() {
    return this.#activation_func(this.value)
  }

  get_type() {
    return this.#type
  }

  get_parent() {
    return this.#parent
  }
}