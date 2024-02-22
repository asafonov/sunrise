class InstrumentTrackView {

  constructor (name) {
    this.container = document.querySelector('.instrument')
    this.controller = new InstrumentTrackController(name)
    this.views = []
    const list = this.controller.getModel().getTrack()
    let i = 0

    for (let k in list) {
      this.views.push(new InstrumentNoteTrackView(name, k, list[k], asafonov.colors[i % asafonov.colors.length], this.container))
      ++i
    }
  }

  getController() {
    return this.controller
  }

  destroy() {
    for (let i = 0; i < this.views.length; ++i)
      this.views[i].destroy()

    this.views = null
    this.controller.destroy()
    this.controller = null
    this.container = null
  }

}
