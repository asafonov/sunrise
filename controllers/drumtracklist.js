class DrumTrackListController {

  constructor () {
    this.tracks = []
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

  onIsPlayingUpdate ({isPlaying}) {
    if (this.timeout) clearTimeout(this.timeout)
    if (! isPlaying) return

    const result = this.tracks[0].getTrack()
    console.log(result)
    asafonov.waveUtils.play(result)
  }

  destroy() {
    this.removeEventListeners()
    if (this.timeout) clearTimeout(this.timeout)
    this.timeout = null
    this.tracks = null
  }

}
