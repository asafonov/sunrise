class DrumTrackListController {

  constructor (tempo) {
    this.tempo = tempo || 120
    this.interval = 60 / this.tempo / 4 * 1000
    this.tracks = []
    this.addEventListeners()
  }

  addEventListeners() {
    asafonov.messageBus.subscribe(asafonov.events.IS_PLAYING_UPDATED, this, 'onIsPlayingUpdate')
  }

  removeEventListeners() {
    asafonov.messageBus.unsubscribe(asafonov.events.IS_PLAYING_UPDATED, this, 'onIsPlayingUpdate')
  }

  addTrackController (controller) {
    this.tracks.push(controller)
  }

  onIsPlayingUpdate ({isPlaying}) {
    if (this.timeout) clearTimeout(this.timeout)
    if (! isPlaying) return
    if (this.tracks.length === 0) return

    for (let i = 0; i < this.tracks[0].getModel().getLength(); ++i) {
      for (let j = 0; j < this.tracks.length; ++j) {
        const f = []

        if (this.tracks[j].isOn(i)) f.push(() => this.tracks[j].play())
        if (f.length > 0) setTimeout(() => {
          for (let k = 0; k < f.length; ++k) f[k]()
        }, i * this.interval)
      }
    }
  }

  destroy() {
    this.removeEventListeners()
    if (this.timeout) clearTimeout(this.timeout)
    this.timeout = null
    this.tracks = null
    this.tempo = null
    this.interval = null
  }

}
