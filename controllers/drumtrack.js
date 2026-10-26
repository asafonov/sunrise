class DrumTrackController {

  constructor (name, length) {
    this.name = name
    this.length = length
    this.model = [new DrumTrack(name, length)]
    this.addEventListeners()
  }

  addEventListeners() {
    asafonov.messageBus.subscribe(asafonov.events.TRACK_VIEW_UPDATED, this, 'onTrackViewUpdate')
    asafonov.messageBus.subscribe(asafonov.events.SPEAKER_VIEW_UPDATED, this, 'onSpeakerViewUpdate')
    asafonov.messageBus.subscribe(asafonov.events.VOLUME_VIEW_UPDATED, this, 'onVolumeViewUpdate')
    asafonov.messageBus.subscribe(asafonov.events.LOOP_UPDATED, this, 'onLoopUpdate')
  }

  removeEventListeners() {
    asafonov.messageBus.unsubscribe(asafonov.events.TRACK_VIEW_UPDATED, this, 'onTrackViewUpdate')
    asafonov.messageBus.unsubscribe(asafonov.events.SPEAKER_VIEW_UPDATED, this, 'onSpeakerViewUpdate')
    asafonov.messageBus.unsubscribe(asafonov.events.VOLUME_VIEW_UPDATED, this, 'onVolumeViewUpdate')
    asafonov.messageBus.unsubscribe(asafonov.events.LOOP_UPDATED, this, 'onLoopUpdate')
  }

  play() {
    asafonov.waveUtils.play(this.model[asafonov.loopNumber].getBytes())
  }

  onLoopUpdate() {
    if (this.model[asafonov.loopNumber] === null || this.model[asafonov.loopNumber] === undefined) {
      this.model.push(new DrumTrack(this.name, this.length))
    }

    const track = this.model[asafonov.loopNumber].getTrack()

    for (let index = 0; index < track.length; ++index) {
      const value = track[index]
      asafonov.messageBus.send(asafonov.events.TRACK_MODEL_UPDATED, {name: this.name, index, value})
    }
  }

  onTrackViewUpdate (data) {
    if (data.name !== this.model[asafonov.loopNumber].getName()) {
      return
    }

    this.play()
    this.model[asafonov.loopNumber].updateTrackIndex(data.index)
    data.value = this.model[asafonov.loopNumber].getTrack()[data.index]
    asafonov.messageBus.send(asafonov.events.TRACK_MODEL_UPDATED, data)
  }

  onSpeakerViewUpdate (data) {
    if (data.name !== this.model[asafonov.loopNumber].getName()) {
      return
    }

    this.model[asafonov.loopNumber].updateIsMuted()
    asafonov.messageBus.send(asafonov.events.VOLUME_MODEL_UPDATED, {name: data.name, isMuted: this.model[asafonov.loopNumber].getIsMuted()})
  }

  onVolumeViewUpdate (data) {
    if (data.name !== this.model[asafonov.loopNumber].getName()) {
      return
    }

    this.model[asafonov.loopNumber].setVolume(data.volume)
    asafonov.messageBus.send(asafonov.events.VOLUME_MODEL_UPDATED, {name: data.name, isMuted: this.model[asafonov.loopNumber].getIsMuted(), volume: this.model[asafonov.loopNumber].getVolume()})
  }

  isOn (index) {
    return this.model[asafonov.loopNumber].getTrack()[index]
  }

  getTrack() {
    const bitLength = 44100 * 60 / asafonov.settings.tempo
    const length = this.model[asafonov.loopNumber].getTrack().length
    const wavs = []
    const starts = []

    for (let i = 0; i < length; ++i) {
      if (this.isOn(i)) {
        wavs.push(this.model[asafonov.loopNumber].getBytes())
        starts.push(i * bitLength)
      }
    }

    if (wavs.length === 0) return

    return asafonov.waveUtils.mixWavs(wavs, starts)
  }

  getModel() {
    return this.model[asafonov.loopNumber]
  }

  destroy() {
    this.removeEventListeners()

    for (let i = 0; i < this.model.length; ++i) {
      this.model[i].destroy()
      this.model[i] = null
    }

    this.model = null
    this.name = null
    this.length = null
  }

}
