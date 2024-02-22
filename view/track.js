class TrackView {

  constructor (data) {
    this.instrumentViews = []

    if (data.drums)
      this.drumView = new DrumTrackListView(data.drums)

    if (data.instruments) {
      for (let i = 0; i < data.instruments.length; ++i) {
        this.instrumentViews.push(new InstrumentTrackView(data.instruments[i]))
      }
    }
  }

  destroy() {
    this.drumView && this.drumView.destroy()
    this.drumView = null

    for (let i = 0; i < this.instrumentViews.length; ++i) {
      this.instrumentViews[i].destroy()
      this.instrumentViews[i] = null
    }

    this.instrumentViews = null
  }

}
