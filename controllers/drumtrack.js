class DrumTrackController {

  constructor (name, length) {
    this.model = new DrumTrack(name, length)
    this.addEventListeners()
  }

  addEventListeners() {
    asafonov.messageBus.subscribe(asafonov.events.TRACK_VIEW_UPDATED, this, 'onTrackViewUpdate')
  }

  removeEventListeners() {
    asafonov.messageBus.unsubscribe(asafonov.events.TRACK_VIEW_UPDATED, this, 'onTrackViewUpdate')
  }

  play() {
    asafonov.waveUtils.play(this.model.getBytes())
  }

  onTrackViewUpdate (data) {
    if (data.name !== this.model.getName()) {
      return
    }

    this.play()
    this.model.updateTrackIndex(data.index)
    asafonov.messageBus.send(asafonov.events.TRACK_MODEL_UPDATED, data)
  }

  isOn (index) {
    return this.model.getTrack()[index]
  }

  getTrack() {
    const bitLength = 44100 * 60 / asafonov.settings.tempo
    const length = this.model.getTrack().length
    const wavs = []
    const starts = []

    for (let i = 0; i < length; ++i) {
      if (this.isOn(i)) {
        wavs.push(this.model.getBytes())
        starts.push(i * bitLength)
      }
    }

    if (wavs.length === 0) return

    return asafonov.waveUtils.mixWavs(wavs, starts)
  }

  getModel() {
    return this.model
  }

  destroy() {
    this.removeEventListeners()
    this.model.destroy()
    this.model = null
  }

}
