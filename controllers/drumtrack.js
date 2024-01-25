class DrumTrackController {

  constructor (name, tempo, length) {
    this.model = new DrumTrack(name, length)
    this.tempo = tempo || 120
    this.interval = 60 / this.tempo / 4 * 1000
    this.addEventListeners()
  }

  addEventListeners() {
    asafonov.messageBus.subscribe(asafonov.events.TRACK_VIEW_UPDATED, this, 'onTrackViewUpdate')
    asafonov.messageBus.subscribe(asafonov.events.IS_PLAYING_UPDATED, this, 'onIsPlayingUpdate')
  }

  removeEventListeners() {
    asafonov.messageBus.unsubscribe(asafonov.events.TRACK_VIEW_UPDATED, this, 'onTrackViewUpdate')
    asafonov.messageBus.unsubscribe(asafonov.events.IS_PLAYING_UPDATED, this, 'onIsPlayingUpdate')
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

  onIsPlayingUpdate ({isPlaying}) {
    this.timeout && clearTimeout(this.timeout)

    if (isPlaying) {
      const track = this.model.getTrack()

      for (let i = 0; i < track.length; ++i) {
        if (track[i]) setTimeout(() => this.play(), i * this.interval)
      }
    }
  }

  getModel() {
    return this.model
  }

  destroy() {
    this.removeEventListeners()
    this.tempo = null
    this.timeout && clearTimeout(this.timeout)
    this.timeout = null
    this.interval = null
    this.model.destroy()
    this.model = null
  }

}
