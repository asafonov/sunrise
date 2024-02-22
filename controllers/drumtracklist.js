class DrumTrackListController {

  constructor (list) {
    this.tracks = []

    for (let i = 0; i < list.length; ++i) {
      this.tracks.push(new DrumTrackController(list[i]))
    }

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

  mixList() {
    const tracks = []

    for (let i = 0; i < this.tracks.length; ++i) {
      tracks.push(this.tracks[i].getTrack())
    }

    return asafonov.waveUtils.mixWavs(tracks)
  }

  destroy() {
    this.removeEventListeners()
    this.timeout && clearTimeout(this.timeout)
    this.timeout = null

    for (let i = 0; i < this.tracks.length; ++i)
      this.tracks[i].destroy()

    this.tracks = null
    this.mix = null
  }

}
