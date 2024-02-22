class DrumTrackListView {

  constructor (list) {
    this.container = document.querySelector('.drumtrack')

    for (let i = 0; i < list.length; ++i) {
      const view = new DrumTrackView(list[i], asafonov.colors[i % asafonov.colors.length], this.container)
    }
  }

  destroy() {
    this.container = null
  }

}
