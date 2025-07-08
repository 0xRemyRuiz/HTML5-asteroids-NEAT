
import reporter from '../libs/reporter.js'

export default (current_game, ws, object) => {
  if (object.get_report) {
    let report = reporter.get_last_report()
    if (!report) {
      report = {}
    }
    report.game = current_game
    ws.send(JSON.stringify(report))
  }
}
