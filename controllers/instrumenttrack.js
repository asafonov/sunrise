class InstrumentTrackController {

  constructor (name, length) {
    this.model = new InstrumentTrack(name, length)
    this.addEventListeners()
  }

  addEventListeners() {
    asafonov.messageBus.subscribe(asafonov.events.TRACK_VIEW_UPDATED, this, 'onTrackViewUpdate')
  }

  removeEventListeners() {
    asafonov.messageBus.unsubscribe(asafonov.events.TRACK_VIEW_UPDATED, this, 'onTrackViewUpdate')
  }

  play (note) {
    const data = this.model.getBytes(note)
    asafonov.waveUtils.play(data)
  }

  onTrackViewUpdate (data) {
    if (data.name !== this.model.getName()) {
      return
    }

    this.play(data.note)
    this.model.updateTrackIndex(data.note, data.index)
    asafonov.messageBus.send(asafonov.events.TRACK_MODEL_UPDATED, data)
  }

  isOn (note, index) {
    return this.model.getTrack()[note][index]
  }

  getTrack() {
    const wavs = []

    for (let k in asafonov.notes) {
      wavs.push(this.getNoteTrack(k))
    }

    return asafonov.waveUtils.mixWavs(wavs)
  }

  getNoteTrack(note) {
    const bitLength = 44100 * 60 / asafonov.settings.tempo
    const length = this.model.getTrack()[note].length
    const wavs = []
    const starts = []

    for (let i = 0; i < length; ++i) {
      if (this.isOn(i)) {
        wavs.push(this.model.getBytes(note))
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
