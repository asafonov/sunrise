class DrumTrackController {

  constructor (name, length) {
    this.model = new DrumTrack(name, length)
    this.addEventListeners()
  }

  addEventListeners() {
    asafonov.messageBus.subscribe(asafonov.events.TRACK_VIEW_UPDATED, this, 'onTrackViewUpdate')
    asafonov.messageBus.subscribe(asafonov.events.SPEAKER_VIEW_UPDATED, this, 'onSpeakerViewUpdate')
    asafonov.messageBus.subscribe(asafonov.events.VOLUME_VIEW_UPDATED, this, 'onVolumeViewUpdate')
  }

  removeEventListeners() {
    asafonov.messageBus.unsubscribe(asafonov.events.TRACK_VIEW_UPDATED, this, 'onTrackViewUpdate')
    asafonov.messageBus.unsubscribe(asafonov.events.SPEAKER_VIEW_UPDATED, this, 'onSpeakerViewUpdate')
    asafonov.messageBus.unsubscribe(asafonov.events.VOLUME_VIEW_UPDATED, this, 'onVolumeViewUpdate')
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

  onSpeakerViewUpdate (data) {
    if (data.name !== this.model.getName()) {
      return
    }

    this.model.updateIsMuted()
    asafonov.messageBus.send(asafonov.events.VOLUME_MODEL_UPDATED, {name: data.name, isMuted: this.model.getIsMuted()})
  }

  onVolumeViewUpdate (data) {
    if (data.name !== this.model.getName()) {
      return
    }

    this.model.setVolume(data.volume)
    asafonov.messageBus.send(asafonov.events.VOLUME_MODEL_UPDATED, {name: data.name, isMuted: this.model.getIsMuted(), volume: this.model.getVolume()})
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
