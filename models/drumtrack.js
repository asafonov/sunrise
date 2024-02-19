class DrumTrack {

  constructor (name, length) {
    this.name = name
    this.volume = 1
    this.isMuted = false
    this.data = []
    this.length = length || 16
    this.initTrack(this.length)
    const file = `./audio/${name}/01.wav`
    this.initData(file)
  }

  async initData (file) {
    const res = await fetch(file)
    const reader = res.body.getReader()

    while (true) {
      const data = await reader.read()

      if (data.value) this.data = this.data.concat(Array.from(data.value))
      if (data.done) break
    }

    this.data = this.data.slice(44)
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

  getVolume() {
    return this.volume
  }

  setVolume (volume) {
    this.volume = volume
  }

  getIsMuted() {
    return this.isMuted
  }

  updateIsMuted() {
    this.isMuted = ! this.isMuted
  }

  getName() {
    return this.name
  }

  getTrack() {
    return this.track
  }

  getLength() {
    return this.length
  }

  getBytes() {
    if (this.isMuted) return []
    if (this.volume !== 1) return asafonov.waveUtils.updateVolume(this.data, this.volume)
    return this.data
  }

  destroy() {
    this.name = null
    this.volume = null
    this.isMuted  = null
    this.data = null
    this.track = null
    this.length = null
  }
}
