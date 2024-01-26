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

  isOn (index) {
    return this.model.getTrack()[index]
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
