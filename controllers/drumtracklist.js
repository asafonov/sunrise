class DrumTrackListController {

  constructor (list) {
    this.tracks = []

    for (let i = 0; i < list.length; ++i) {
      this.tracks.push(new DrumTrackController(list[i]))
    }

    this.mix = []
  }

  mixList() {
    const tracks = []

    for (let i = 0; i < this.tracks.length; ++i) {
      tracks.push(this.tracks[i].getTrack())
    }

    return asafonov.waveUtils.mixWavs(tracks)
  }

  destroy() {
    for (let i = 0; i < this.tracks.length; ++i)
      this.tracks[i].destroy()

    this.tracks = null
    this.mix = null
  }

}
