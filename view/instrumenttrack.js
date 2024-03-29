class InstrumentTrackView {

  constructor (name) {
    this.container = document.querySelector('.instrument')
    this.views = []
    let i = 0

    for (let k in asafonov.notes) {
      this.views.push(new InstrumentNoteTrackView(name, k, asafonov.colors[i % asafonov.colors.length], this.container))
      ++i
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
      this.views[i].destroy()

    this.views = null
    this.container = null
  }

}
