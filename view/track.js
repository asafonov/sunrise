class TrackView {

  constructor (data) {
    this.container = document.querySelector('.tracks')
    this.instruments = {}
    this.backContainer = document.querySelector('.go_back')

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
    this.onBackClickProxy = this.onBackClick.bind(this)
    this.addEventListeners()
    this.show()
  }

  addEventListeners() {
    for (let i in this.instruments) {
      this.instruments[i].container.addEventListener('click', this.onTrackClickProxy)
    }

    this.backContainer.addEventListener('click', this.onBackClickProxy)
  }

  removeEventListeners() {
    for (let i in this.instruments) {
      this.instruments[i].container.removeEventListener('click', this.onTrackClickProxy)
    }

    this.backContainer.removeEventListener('click', this.onBackClickProxy)
  }

  hide() {
    for (let i in this.instruments) {
      this.instruments[i].container.style.display = 'none'
    }

    this.backContainer.style.display = 'grid'
  }

  show() {
    for (let i in this.instruments) {
      this.instruments[i].container.style.display = 'flex'
      this.instruments[i].view.hide()
    }

    this.backContainer.style.display = 'none'
  }

  onTrackClick (event) {
    const instrument = event.currentTarget.getAttribute('data-instrument')
    this.instruments[instrument].view.show()
    this.backContainer.querySelector(`.${instrument}`).classList.add('.icon_on')
    this.hide()
  }

  onBackClick (event) {
    const icons = this.backContainer.querySelectorAll('.back_icon')

    for (let i = 0; i < icons.length; ++i) {
      icons[i].classList.remove('.icon_on')
    }

    this.show()
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
    this.backContainer = null
    this.container = null
  }

}
