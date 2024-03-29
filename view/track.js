class TrackView {

  constructor (data) {
    this.container = document.querySelector('.tracks')
    this.instruments = {}

    if (data.drums) {
      this.drums = {
        view: new DrumTrackListView(data.drums),
        container: this.container.querySelector('.drums')
      }
      this.drums.container.style.display = 'flex'
    }

    if (data.instruments) {
      for (let i = 0; i < data.instruments.length; ++i) {
        this.instruments[data.instruments[i]] = {
          view: new InstrumentTrackView(data.instruments[i])),
          container: this.container.querySelector(`.${data.instruments[i]}`)
        }
        this.instruments[data.instruments[i]].container.style.display = 'flex'
      }
    }
  }

  destroy() {
    this.drums && this.drums.view.destroy()
    this.drums.view = null
    this.drums.container = null
    this.drums = null

    for (let i of this.instruments) {
      i.view.destroy()
      i.view = null
      i.container = null
      i = null
    }

    this.instruments = null
    this.container = null
  }

}
