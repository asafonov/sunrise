class UpdaterView {

  constructor (upstreamVersionUrl, updateUrl) {
    this.model = new Updater(upstreamVersionUrl)
    this.updateUrl = updateUrl
  }

  showUpdateDialogIfNeeded() {
    this.model.isUpdateNeeded()
      .then(isUpdateNeeded => {
        if (isUpdateNeeded) this.showUpdateDialog()
      })
  }

  showUpdateDialog() {
    if (confirm('New version available. Do you want to update the App?')) location.href = this.model.getUpdateUrl(this.updateUrl)
  }
}
