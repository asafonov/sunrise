document.addEventListener("DOMContentLoaded", function (event) {
  const updaterView = new UpdaterView('https://raw.githubusercontent.com/asafonov/sunrise.web/master/VERSION.txt', 'https://github.com/asafonov/sunrise.apk/releases/download/{VERSION}/app-release.apk')
  updaterView.showUpdateDialogIfNeeded()
  const drums = ['kick', 'hihat', 'snare', 'low_tom', 'medium_tom', 'high_tom', 'crash']
  const view = new DrumTrackListView(drums)
})
