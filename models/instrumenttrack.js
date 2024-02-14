class InstrumentTrack {

  constructor (name, length, base) {
    this.name = name
    this.data = []
    this.length = length || 16
    this.base = base || 'c4'
    this.initTrack(this.length)
    const file = `./audio/${name}/${this.base}.wav`
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
    this.track = {}

    for (let k in asafonov.notes) {
      this.track[k] = []    

      for (let i = 0; i < length; ++i) {
        this.track[k].push(false)
      }
    }

  }

  updateTrackIndex (key, index) {
    this.track[key][index] = ! this.track[key][index]
    return this.track[key][index]
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

  getBytes (note) {
    if (note === this.base)
      return this.data

    if (! asafonov.notes[note]) return []

    const ratio = asafonov.notes[this.base] / asafonov.notes[note]
    return asafonov.waveUtils.pitch(this.data, ratio)
  }

  destroy() {
    this.name = null
    this.data = null
    this.track = null
    this.base = null
    this.length = null
  }
}
