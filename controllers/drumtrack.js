class DrumTrackController {

  constructor (name, tempo, length) {
    this.model = new DrumTrack(name, length)
    this.audio = new Audio(this.model.getFile())
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
    this.audio.play()
  }

  onTrackViewUpdate (data) {
    if (data.name !== this.model.getName()) {
      return
    }

    this.play()
  }

  getModel() {
    return this.model
  }

  destroy() {
    this.removeEventListeners()
    this.tempo = null
    this.audio = null
    this.model.destroy()
    this.model = null
  }

}