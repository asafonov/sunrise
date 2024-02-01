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
    return 60 / asafonov.settings.tempo / 4 * 1000
  }

  addTrackController (controller) {
    this.tracks.push(controller)
  }

  mixList() {
    const tracks = []

    for (let i = 0; i < this.tracks.length; ++i) {
      tracks.push(this.tracks[i].getTrack())
    }

    this.mix = asafonov.waveUtils.mixWavs(tracks)
  }

  onIsPlayingUpdate ({isPlaying}) {
    if (this.timeout) {
      clearTimeout(this.timeout)
    }

    if (! isPlaying) return
    this.timeout = setTimeout(() => this.onIsPlayingUpdate({isPlaying}), this.getInterval() * 16)
    this.mix.length === 0 && this.mixList()
    asafonov.waveUtils.play(this.mix)
  }

  destroy() {
    this.removeEventListeners()
    if (this.timeout) clearTimeout(this.timeout)
    this.timeout = null
    this.tracks = null
    this.mix = null
  }

}
