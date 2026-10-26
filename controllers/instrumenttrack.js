class InstrumentTrackController {

  constructor (name, length) {
    this.name = name
    this.length = length
    this.model = [new InstrumentTrack(name, length)]
    this.addEventListeners()
  }

  addEventListeners() {
    asafonov.messageBus.subscribe(asafonov.events.TRACK_VIEW_UPDATED, this, 'onTrackViewUpdate')
    asafonov.messageBus.subscribe(asafonov.events.LOOP_UPDATED, this, 'onLoopUpdate')
  }

  removeEventListeners() {
    asafonov.messageBus.unsubscribe(asafonov.events.TRACK_VIEW_UPDATED, this, 'onTrackViewUpdate')
    asafonov.messageBus.unsubscribe(asafonov.events.LOOP_UPDATED, this, 'onLoopUpdate')
  }

  play (note) {
    const data = this.model[asafonov.loopNumber].getBytes(note)
    asafonov.waveUtils.play(data)
  }

  onTrackViewUpdate (data) {
    if (data.name !== this.model[asafonov.loopNumber].getName()) {
      return
    }

    this.play(data.note)
    this.model[asafonov.loopNumber].updateTrackIndex(data.note, data.index)
    data.value = this.model[asafonov.loopNumber].getTrack()[data.note][data.index]
    asafonov.messageBus.send(asafonov.events.TRACK_MODEL_UPDATED, data)
  }

  onLoopUpdate() {
    if (this.model[asafonov.loopNumber] === null || this.model[asafonov.loopNumber] === undefined) {
      this.model.push(new InstrumentTrack(this.name, this.length))
    }

    const track = this.model[asafonov.loopNumber].getTrack()

    for (let note in asafonov.notes) {
      for (let index = 0; index < track[note].length; ++index) {
        const data = {
          name: this.name,
          note,
          index,
          value: track[note][index]
        }
        asafonov.messageBus.send(asafonov.events.TRACK_MODEL_UPDATED, data)
      }
    }
  }

  isOn (note, index) {
    return this.model[asafonov.loopNumber].getTrack()[note][index]
  }

  getTrack() {
    const wavs = []

    for (let k in asafonov.notes) {
      wavs.push(this.getNoteTrack(k))
    }

    return asafonov.waveUtils.mixWavs(wavs)
  }

  getNoteTrack (note) {
    const bitLength = 44100 * 60 / asafonov.settings.tempo
    const length = this.model[asafonov.loopNumber].getTrack()[note].length
    const wavs = []
    const starts = []

    for (let i = 0; i < length; ++i) {
      if (this.isOn(note, i)) {
        wavs.push(this.model[asafonov.loopNumber].getBytes(note))
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
