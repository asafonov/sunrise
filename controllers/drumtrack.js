class DrumTrackController {

  constructor (name, tempo, length) {
    this.model = new DrumTrack(name, length)
    this.tempo = tempo || 120
    this.addEventListeners()
  }

  addEventListeners() {
    asafonov.messageBus.subscribe(asafonov.events.TRACK_VIEW_UPDATED, this, 'onTrackViewUpdate')
  }

  removeEventListeners() {
    asafonov.messageBus.unsubscribe(asafonov.events.TRACK_VIEW_UPDATED, this, 'onTrackViewUpdate')
  }

  play() {
    const audio = new Audio(this.model.getFile())
    audio.play()
  }

  onTrackViewUpdate (data) {
    if (data.name !== this.model.getName()) {
      return
    }

    this.play()
    this.model.updateTrackIndex(data.index)
    asafonov.messageBus.send(asafonov.events.TRACK_MODEL_UPDATED, data)
  }

  getModel() {
    return this.model
  }

  destroy() {
    this.removeEventListeners()
    this.tempo = null
    this.model.destroy()
    this.model = null
  }

}
