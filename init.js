document.addEventListener("DOMContentLoaded", function (event) {
  const updaterView = new UpdaterView('https://raw.githubusercontent.com/asafonov/sunrise.web/master/VERSION.txt', 'https://github.com/asafonov/sunrise.apk/releases/download/{VERSION}/app-release.apk')
  updaterView.showUpdateDialogIfNeeded()
})
