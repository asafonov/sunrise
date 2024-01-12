class DrumTrack {

  constructor (name, length) {
    this.name = name
    this.file = `./audio/${name}/01.mp3`
    this.initTrack(length || 16)
  }

  initTrack (length) {
    this.track = []

    for (let i = 0; i < length; ++i) {
      this.track.push(false)
    }
  }

  updateTrackIndex (index) {
    this.track[index] = ! this.track[index]
    return this.track[index]
  }

  getName() {
    return this.name
  }

  getTrack() {
    return this.track
  }

  getFile() {
    return this.file
  }

  destroy() {
    this.name = null
    this.file = null
    this.track = null
  }
}
