document.addEventListener("DOMContentLoaded", function (event) {
  const updaterView = new UpdaterView('https://raw.githubusercontent.com/asafonov/sunrise/master/VERSION.txt', 'https://github.com/asafonov/sunrise.apk/releases/download/{VERSION}/app-release.apk')
  updaterView.showUpdateDialogIfNeeded()
  const data = {
    drums: ['kick', 'hihat', 'snare', 'low_tom', 'medium_tom', 'high_tom', 'crash'],
    instruments: ['rocky_guitar']
  }
  const controller = new TrackController(data)
  const tempoController = new TempoController()
  const view = new TrackView(data)
  const controls = ['play', 'stop']
  const controlView = new ControlListView(controls)
  const tempoView = new TempoView()
})
