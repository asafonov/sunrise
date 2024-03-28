class TrackView {

  constructor (data) {
    this.container = document.querySelector('.tracks')
    this.instrumentViews = []
    this.instrumentContainers = []

    if (data.drums) {
      this.drumView = new DrumTrackListView(data.drums)
      this.drumContainer = this.container.querySelector('.drums')
      this.drumContainer.style.display = 'flex'
    }

    if (data.instruments) {
      for (let i = 0; i < data.instruments.length; ++i) {
        this.instrumentViews.push(new InstrumentTrackView(data.instruments[i]))
        this.instrumentContainers.push(this.container.querySelector(`.${data.instruments[i]}`))
        this.instrumentContainers[this.instrumentContainers.length - 1].style.display = 'flex'
      }
    }
  }

  destroy() {
    this.drumView && this.drumView.destroy()
    this.drumView = null

    for (let i = 0; i < this.instrumentViews.length; ++i) {
      this.instrumentViews[i].destroy()
      this.instrumentViews[i] = null
      this.instrumentContainers[i] = null
    }

    this.instrumentContainers = null
    this.instrumentViews = null
    this.container = null
    this.drumContainer = null
  }

}
