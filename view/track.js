class TrackView {

  constructor (data) {
    this.container = document.querySelector('.tracks')
    this.instruments = {}

    if (data.drums) {
      this.instruments.drums = {
        view: new DrumTrackListView(data.drums),
        container: this.container.querySelector('.drums')
      }
      this.instruments.drums.container.style.display = 'flex'
    }

    if (data.instruments) {
      for (let i = 0; i < data.instruments.length; ++i) {
        this.instruments[data.instruments[i]] = {
          view: new InstrumentTrackView(data.instruments[i]),
          container: this.container.querySelector(`.${data.instruments[i]}`)
        }
        this.instruments[data.instruments[i]].container.style.display = 'flex'
      }
    }

    this.onTrackClickProxy = this.onTrackClick.bind(this)
    this.addEventListeners()
  }

  addEventListeners() {
    for (let i in this.instruments) {
      this.instruments[i].container.addEventListener('click', this.onTrackClickProxy)
    }
  }

  removeEventListeners() {
    for (let i in this.instruments) {
      this.instruments[i].container.removeEventListener('click', this.onTrackClickProxy)
    }
  }

  hide() {
    for (let i in this.instruments) {
      this.instruments[i].container.style.display = 'none'
    }
  }

  show() {
    for (let i in this.instruments) {
      this.instrument[i].container.style.display = 'flex'
    }
  }

  onTrackClick (event) {
    const instrument = event.currentTarget.getAttribute('data-instrument')
    this.instruments[instrument].view.show()
    this.hide()
  }

  destroy() {
    this.removeEventListeners()

    for (let i in this.instruments) {
      this.instruments[i].view.destroy()
      this.instruments[i].view = null
      this.instruments[i].container = null
      this.instruments[i] = null
    }

    this.instruments = null
    this.container = null
  }

}
