class DrumTrackListController {

  constructor () {
    this.tracks = []
    this.mix = []
    this.addEventListeners()
  }

  addEventListeners() {
    asafonov.messageBus.subscribe(asafonov.events.IS_PLAYING_UPDATED, this, 'onIsPlayingUpdate')
  }

  removeEventListeners() {
    asafonov.messageBus.unsubscribe(asafonov.events.IS_PLAYING_UPDATED, this, 'onIsPlayingUpdate')
  }

  getInterval() {
    return asafonov.waveUtils.getInterval(asafonov.settings.tempo)
  }

  addTrackController (controller) {
    this.tracks.push(controller)
  }

  mixList() {
    const tracks = []

    for (let i = 0; i < this.tracks.length; ++i) {
      tracks.push(this.tracks[i].getTrack())
    }

    return asafonov.waveUtils.mixWavs(tracks)
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
    this.removeEventListeners()
    this.timeout && clearTimeout(this.timeout)
    this.timeout = null
    this.tracks = null
    this.mix = null
  }

}
