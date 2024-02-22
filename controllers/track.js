class TrackController {

  constructor (data) {
    this.instruments = []

    if (data.drums)
      this.drums = new DrumTrackListController(data.drums)

    if (data.instruments) {
      for (let i = 0; i < data.instruments.length; ++i) {
        this.instrumentViews.push(new InstrumentController(data.instruments[i]))
      }
    }
  }

  onIsPlayingUpdate ({isPlaying, loop}) {
    if (this.timeout) {
      clearTimeout(this.timeout)
    }

    if (! isPlaying) return

    if (loop) {
      this.timeout = setTimeout(() => this.onIsPlayingUpdate({isPlaying, loop: true}), this.getInterval() * 16)
      return asafonov.waveUtils.play()
    }

    const data = this.mixList()

    if (data.length > 0) {
      asafonov.waveUtils.play(data)
      this.timeout = setTimeout(() => this.onIsPlayingUpdate({isPlaying, loop: true}), this.getInterval() * 16)
    }
  }

  destroy() {
    this.drums && this.drums.destroy()
    this.drums = null

    for (let i = 0; i < this.instruments.length; ++i) {
      this.instruments[i].destroy()
    }

    this.instruments = null
  }
}
