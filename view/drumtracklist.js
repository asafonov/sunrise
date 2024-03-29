class DrumTrackListView {

  constructor (list) {
    this.container = document.querySelector('.drumtrack')
    this.views = []

    for (let i = 0; i < list.length; ++i) {
      this.views.push(new DrumTrackView(list[i], asafonov.colors[i % asafonov.colors.length], this.container))
    }

    this.hide()
  }

  hide() {
    this.container.style.display = 'none'
  }

  show() {
    this.container.style.display = 'flex'
  }

  destroy() {
    for (let i = 0; i < this.views.length; ++i)
      this.views.destroy()

    this.container = null
  }

}
