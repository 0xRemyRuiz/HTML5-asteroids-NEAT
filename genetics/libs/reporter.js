
// very basic reporter singleton to ease visual debugging
const singleton = []

export default {
  singleton,
  add_report: (obj) => {
    singleton.push(obj)
  },
  get_last_report: () => {
    if (singleton.length > 0) {
      return singleton[singleton.length - 1]
    }
    return undefined
  },
}
