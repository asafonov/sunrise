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
class MessageBus {
  constructor() {
    this.subscribers = {};
  }
  send (type, data) {
    if (this.subscribers[type] !== null && this.subscribers[type] !== undefined) {
      for (var i = 0; i < this.subscribers[type].length; ++i) {
        this.subscribers[type][i]['object'][this.subscribers[type][i]['func']](data);
      }
    }
  }
  subscribe (type, object, func) {
    if (this.subscribers[type] === null || this.subscribers[type] === undefined) {
      this.subscribers[type] = [];
    }
    this.subscribers[type].push({
      object: object,
      func: func
    });
  }
  unsubscribe (type, object, func) {
    for (var i = 0; i < this.subscribers[type].length; ++i) {
      if (this.subscribers[type][i].object === object && this.subscribers[type][i].func === func) {
        this.subscribers[type].slice(i, 1);
        break;
      }
    }
  }
  unsubsribeType (type) {
    delete this.subscribers[type];
  }
  destroy() {
    for (type in this.subscribers) {
      this.unsubsribeType(type);
    }
    this.subscribers = null;
  }
}
const notes = {
  c4: 26163,
  c_4: 27718,
  d4: 29366,
  d_4: 31113,
  e4: 32963,
  f4: 34923,
  f_4: 36999,
  g4: 39200,
  g_4: 41530,
  a4: 44000,
  a_4: 46616,
  b4: 49388
}
class Updater {
  constructor (upstreamVersionUrl) {
    this.upstreamVersionUrl = upstreamVersionUrl
  }
  getCurrentVersion() {
    return window.asafonov.version
  }
  getUpstreamVersion() {
    return fetch(this.upstreamVersionUrl)
      .then(data => data.text())
      .then(data => data.replace(/[^0-9\.]/g, ''))
  }
  compareVersion (v1, v2) {
    const _v1 = v1.split('.').map(i => parseInt(i, 10))
    const _v2 = v2.split('.').map(i => parseInt(i, 10))
    let ret = false
    for (let i = 0; i < _v1.length; ++i) {
      if (_v1[i] !== _v2[i]) {
        ret = _v1[i] > _v2[i]
        break
      }
    }
    return ret
  }
  getUpdateUrl (template) {
    return template.replace('{VERSION}', this.upstreamVersion)
  }
  isUpdateNeeded() {
    return this.getUpstreamVersion().
      then(upstreamVersion => {
        this.upstreamVersion = upstreamVersion
        const currentVersion = this.getCurrentVersion()
        return this.compareVersion(upstreamVersion, currentVersion)
      })
  }
}
const waveUtils = {
  url: null,
  normalize: v => v >= 0 ? Math.min(v, 256 * 128 - 1) : Math.max(v, -256 * 128 + 1) + 256 * 256 -1,
  getInterval : tempo => 60 / tempo / 4 * 1000,
  formatSize: size => {
    const ret = [size % 256]
    ret.push((size - ret[0]) / 256 % 256)
    ret.push((size - ret[0] - ret[1] * 256) / 256 / 256 % 256)
    ret.push((size - ret[0] - ret[1] * 256 - ret[2] * 256 * 256) / 256 / 256 / 256 % 256)
    return ret
  },
  updateVolume: (wav, volume) => {
    let i = 0
    const ret = []
    while (i < wav.length) {
      let v = wav[i] + wav[i + 1] * 256
      if (v > 256 * 128 - 1) v = v - 256*256 + 1
      v = v * volume
      v = waveUtils.normalize(v)
      const first = v % 256
      const second = (v - first) / 256
      ret.push(first)
      ret.push(second)
      i += 2
    }
    return ret
  },
  pitch: (wav, ratio) => {
    const bytesPerStep = 2
    let p = 0
    let i = 0
    const ret = []
    while (i < wav.length) {
      const n = parseInt(i / bytesPerStep * (1 - ratio))
      if (n > p) {
        p = n
      } else {
        for (let j = 0; j < bytesPerStep; ++j)
          ret.push(wav[i + j])
      }
      i += bytesPerStep
    }
    return ret
  },
  getWavHeader: length => {
    return [82, 73, 70, 70,
          ...waveUtils.formatSize(length + 44),
          87, 65, 86, 69,
          102, 109, 116, 32,
          16, 0, 0, 0,
          1, 0, 2, 0,
          68, 172, 0, 0,
          16, 177, 2, 0,
          4, 0, 16, 0,
          100, 97, 116, 97,
          ...waveUtils.formatSize(length)]
  },
  mixWavs: (wavs, starts) => {
    wavs = wavs.filter(i => i && i.length > 0)
    if (starts === null || starts === undefined) starts = []
    let length = 0
    for (let i = 0; i < wavs.length; ++i) {
      length = Math.max(wavs[i].length + (starts[i] || 0), length)
    }
    let i = 0
    const ret = []
    while (i < length - 1) {
      let res = 0
      for (let j = 0; j < wavs.length; ++j) {
        const b0 = ! starts[j] || i >= starts[j] ? wavs[j][i - (starts[j] || 0)] || 0 : 0
        const b1 = ! starts[j] || i >= starts[j] ? wavs[j][i + 1 - (starts[j] || 0)] || 0 : 0
        let v = b0 + b1 * 256
        if (v > 256 * 128 - 1) v = v - 256*256 + 1
        res += v
      }
      res = waveUtils.normalize(res)
      const first = res % 256
      const second = (res - first) / 256
      ret.push(first)
      ret.push(second)
      i += 2
    }
    return ret
  },
  play: bytes => {
    const audio = new Audio()
    if (bytes !== null && bytes !== undefined) {
      const buffer = new Uint8Array(bytes.length + 44)
      buffer.set(new Uint8Array([...waveUtils.getWavHeader(bytes.length), ...bytes]), 0)
      const blob = new Blob([buffer], {type: 'audio/wav'})
      waveUtils.url = URL.createObjectURL(blob)
    }
    audio.src = waveUtils.url
    audio.play()
  }
}
class DrumTrackController {
  constructor (name, length) {
    this.model = new DrumTrack(name, length)
    this.addEventListeners()
  }
  addEventListeners() {
    asafonov.messageBus.subscribe(asafonov.events.TRACK_VIEW_UPDATED, this, 'onTrackViewUpdate')
    asafonov.messageBus.subscribe(asafonov.events.SPEAKER_VIEW_UPDATED, this, 'onSpeakerViewUpdate')
    asafonov.messageBus.subscribe(asafonov.events.VOLUME_VIEW_UPDATED, this, 'onVolumeViewUpdate')
  }
  removeEventListeners() {
    asafonov.messageBus.unsubscribe(asafonov.events.TRACK_VIEW_UPDATED, this, 'onTrackViewUpdate')
    asafonov.messageBus.unsubscribe(asafonov.events.SPEAKER_VIEW_UPDATED, this, 'onSpeakerViewUpdate')
    asafonov.messageBus.unsubscribe(asafonov.events.VOLUME_VIEW_UPDATED, this, 'onVolumeViewUpdate')
  }
  play() {
    asafonov.waveUtils.play(this.model.getBytes())
  }
  onTrackViewUpdate (data) {
    if (data.name !== this.model.getName()) {
      return
    }
    this.play()
    this.model.updateTrackIndex(data.index)
    data.value = this.model.getTrack()[data.index]
    asafonov.messageBus.send(asafonov.events.TRACK_MODEL_UPDATED, data)
  }
  onSpeakerViewUpdate (data) {
    if (data.name !== this.model.getName()) {
      return
    }
    this.model.updateIsMuted()
    asafonov.messageBus.send(asafonov.events.VOLUME_MODEL_UPDATED, {name: data.name, isMuted: this.model.getIsMuted()})
  }
  onVolumeViewUpdate (data) {
    if (data.name !== this.model.getName()) {
      return
    }
    this.model.setVolume(data.volume)
    asafonov.messageBus.send(asafonov.events.VOLUME_MODEL_UPDATED, {name: data.name, isMuted: this.model.getIsMuted(), volume: this.model.getVolume()})
  }
  isOn (index) {
    return this.model.getTrack()[index]
  }
  getTrack() {
    const bitLength = 44100 * 60 / asafonov.settings.tempo
    const length = this.model.getTrack().length
    const wavs = []
    const starts = []
    for (let i = 0; i < length; ++i) {
      if (this.isOn(i)) {
        wavs.push(this.model.getBytes())
        starts.push(i * bitLength)
      }
    }
    if (wavs.length === 0) return
    return asafonov.waveUtils.mixWavs(wavs, starts)
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
class DrumTrackListController {
  constructor (list) {
    this.tracks = []
    for (let i = 0; i < list.length; ++i) {
      this.tracks.push(new DrumTrackController(list[i]))
    }
    this.mix = []
  }
  getTrack() {
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
class InstrumentTrackController {
  constructor (name, length) {
    this.model = new InstrumentTrack(name, length)
    this.addEventListeners()
  }
  addEventListeners() {
    asafonov.messageBus.subscribe(asafonov.events.TRACK_VIEW_UPDATED, this, 'onTrackViewUpdate')
  }
  removeEventListeners() {
    asafonov.messageBus.unsubscribe(asafonov.events.TRACK_VIEW_UPDATED, this, 'onTrackViewUpdate')
  }
  play (note) {
    const data = this.model.getBytes(note)
    asafonov.waveUtils.play(data)
  }
  onTrackViewUpdate (data) {
    if (data.name !== this.model.getName()) {
      return
    }
    this.play(data.note)
    this.model.updateTrackIndex(data.note, data.index)
    data.value = this.model.getTrack()[data.note][data.index]
    asafonov.messageBus.send(asafonov.events.TRACK_MODEL_UPDATED, data)
  }
  isOn (note, index) {
    return this.model.getTrack()[note][index]
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
    const length = this.model.getTrack()[note].length
    const wavs = []
    const starts = []
    for (let i = 0; i < length; ++i) {
      if (this.isOn(note, i)) {
        wavs.push(this.model.getBytes(note))
        starts.push(i * bitLength)
      }
    }
    if (wavs.length === 0) return
    return asafonov.waveUtils.mixWavs(wavs, starts)
  }
  getModel() {
    return this.model
  }
  destroy() {
    this.removeEventListeners()
    this.timeout && clearTimeout(this.timeout)
    this.timeout = null
    this.model.destroy()
    this.model = null
  }
}
class TempoController {
  constructor () {
    this.step = 10
    this.minTempo = 60
    this.maxTempo = 180
    this.addEventListeners()
  }
  addEventListeners() {
    asafonov.messageBus.subscribe(asafonov.events.TEMPO_DECREASE_REQUEST, this, 'onTempoDecrease')
    asafonov.messageBus.subscribe(asafonov.events.TEMPO_INCREASE_REQUEST, this, 'onTempoIncrease')
  }
  removeEventListeners() {
    asafonov.messageBus.unsubscribe(asafonov.events.TEMPO_DECREASE_REQUEST, this, 'onTempoDecrease')
    asafonov.messageBus.unsubscribe(asafonov.events.TEMPO_INCREASE_REQUEST, this, 'onTempoIncrease')
  }
  onTempoIncrease() {
    asafonov.settings.tempo = Math.max(asafonov.settings.tempo + this.step, this.minTempo)
    asafonov.messageBus.send(asafonov.events.TEMPO_CHANGED)
  }
  onTempoDecrease() {
    asafonov.settings.tempo = Math.min(asafonov.settings.tempo - this.step, this.maxTempo)
    asafonov.messageBus.send(asafonov.events.TEMPO_CHANGED)
  }
  destroy() {
    this.removeEventListeners()
    this.step = null
    this.minTempo = null
    this.maxTempo = null
  }
}
class TrackController {
  constructor (data) {
    this.instruments = []
    if (data.drums)
      this.drums = new DrumTrackListController(data.drums)
    if (data.instruments) {
      for (let i = 0; i < data.instruments.length; ++i) {
        this.instruments.push(new InstrumentTrackController(data.instruments[i]))
      }
    }
    this.addEventListeners()
  }
  addEventListeners() {
    asafonov.messageBus.subscribe(asafonov.events.IS_PLAYING_UPDATED, this, 'onIsPlayingUpdate')
  }
  removeEventListeners() {
    asafonov.messageBus.unsubscribe(asafonov.events.IS_PLAYING_UPDATED, this, 'onIsPlayingUpdate')
  }
  getInterval() {
    return asafonov.waveUtils.getInterval(asafonov.settings.tempo)
  }
  mixList() {
    const wavs = []
    this.drums && wavs.push(this.drums.getTrack())
    for (let i = 0; i < this.instruments.length; ++i) {
      wavs.push(this.instruments[i].getTrack())
    }
    return asafonov.waveUtils.mixWavs(wavs)
  }
  onIsPlayingUpdate ({isPlaying, loop}) {
    if (this.timeout) {
      clearTimeout(this.timeout)
    }
    if (! isPlaying) return
    if (loop) {
      this.timeout = setTimeout(() => this.onIsPlayingUpdate({isPlaying, loop: true}), this.getInterval() * 16)
      return asafonov.waveUtils.play()
    }
    const data = this.mixList()
    if (data.length > 0) {
      asafonov.waveUtils.play(data)
      this.timeout = setTimeout(() => this.onIsPlayingUpdate({isPlaying, loop: true}), this.getInterval() * 16)
    }
  }
  destroy() {
    this.removeEventListeners()
    this.drums && this.drums.destroy()
    this.drums = null
    for (let i = 0; i < this.instruments.length; ++i) {
      this.instruments[i].destroy()
    }
    this.instruments = null
  }
}
class ControlView {
  constructor (name, parentContainer) {
    this.name = name
    this.container = document.createElement('div')
    this.container.classList.add('icon')
    this.container.classList.add(`icon_${name}`)
    this.container.classList.add(this.getClassByIsPlaying())
    this.container.innerHTML = this.getIcon()
    parentContainer.appendChild(this.container)
    this.onControlClickedProxy = this.onControlClicked.bind(this)
    this.addEventListeners()
  }
  getIcon() {
    if (this.name === 'play') return '▶'
    if (this.name === 'pause') return '❙&#8201;❙'
    if (this.name === 'stop') return '■'
  }
  addEventListeners() {
    this.container.addEventListener('click', this.onControlClickedProxy)
    asafonov.messageBus.subscribe(asafonov.events.IS_PLAYING_UPDATED, this, 'onIsPlayingUpdate')
  }
  removeEventListeners() {
    this.container.removeEventListener('click', this.onControlClickedProxy)
    asafonov.messageBus.unsubscribe(asafonov.events.IS_PLAYING_UPDATED, this, 'onIsPlayingUpdate')
  }
  onControlClicked() {
    asafonov.messageBus.send(asafonov.events.IS_PLAYING_UPDATED, {isPlaying: this.name === 'play'})
  }
  getClassByIsPlaying (isPlaying) {
    if (isPlaying) {
      return this.name === 'play' ? 'icon_off' : 'icon_on'
    }
    return this.name === 'play' ? 'icon_on' : 'icon_off'
  }
  onIsPlayingUpdate (data) {
    this.container.classList.remove('icon_on')
    this.container.classList.remove('icon_off')
    this.container.classList.add(this.getClassByIsPlaying(data.isPlaying))
  }
  destroy() {
    this.removeEventListeners()
    this.container = null
    this.name = null
  }
}
class ControlListView {
  constructor (list) {
    this.container = document.querySelector('.controls')
    this.views = []
    for (let i = 0; i < list.length; ++i) {
      this.views.push(new ControlView(list[i], this.container))
    }
  }
  destroy() {
    for (let i = 0; i < this.views.length; ++i) {
      this.views[i].destroy()
      this.views[i] = null
    }
    this.views = null
    this.container = null
  }
}
class DrumTrackView {
  constructor (name, color, parentContainer) {
    this.name = name
    const container = document.createElement('div')
    container.classList.add('row')
    container.classList.add('notes_row')
    parentContainer.appendChild(container)
    const volumeContainer = document.createElement('div')
    volumeContainer.classList.add('col')
    volumeContainer.classList.add('volume_col')
    container.appendChild(volumeContainer)
    const mainContainer = document.createElement('div')
    mainContainer.classList.add('col')
    mainContainer.classList.add('main_col')
    container.appendChild(mainContainer)
    this.initVolume(volumeContainer)
    this.initName(mainContainer)
    this.initTrack(mainContainer, color)
    this.onSpeakerClickProxy = this.onSpeakerClick.bind(this)
    this.onVolumeRowChangeProxy = this.onVolumeRowChange.bind(this)
    this.addEventListeners()
  }
  addEventListeners() {
    asafonov.messageBus.subscribe(asafonov.events.TRACK_MODEL_UPDATED, this, 'onTrackModelUpdate')
    asafonov.messageBus.subscribe(asafonov.events.VOLUME_MODEL_UPDATED, this, 'onVolumeModelUpdate')
    this.speakerContainer.addEventListener('click', this.onSpeakerClickProxy)
    this.volumeRowContainer.addEventListener('mouseup', this.onVolumeRowChangeProxy)
  }
  removeEventListeners() {
    asafonov.messageBus.unsubscribe(asafonov.events.TRACK_MODEL_UPDATED, this, 'onTrackModelUpdate')
    asafonov.messageBus.unsubscribe(asafonov.events.VOLUME_MODEL_UPDATED, this, 'onVolumeModelUpdate')
    this.speakerContainer.removeEventListener('click', this.onSpeakerClickProxy)
    this.volumeRowContainer.removeEventListener('mouseup', this.onVolumeRowChangeProxy)
  }
  initName (container) {
    const nameContainer = document.createElement('div')
    nameContainer.classList.add('col')
    nameContainer.classList.add('names_col')
    nameContainer.classList.add('name')
    nameContainer.innerHTML = this.name
    container.appendChild(nameContainer)
  }
  initVolume (volumeContainer) {
    this.speakerContainer = document.createElement('div')
    this.speakerContainer.className = 'speaker'
    volumeContainer.appendChild(this.speakerContainer)
    this.volumeRowContainer = document.createElement('div')
    this.volumeRowContainer.classList.add('col')
    this.volumeRowContainer.classList.add('volume_row')
    volumeContainer.appendChild(this.volumeRowContainer)
    this.displayVolume(1)
  }
  displayVolume (volume) {
    this.volumeRowContainer.innerHTML = ''
    volume = Math.min(asafonov.settings.volume.max, Math.floor(asafonov.settings.volume.default * volume))
    for (let i = 0; i < volume; ++i)
      this.volumeRowContainer.innerHTML += '<div class="volume_item"></div>'
  }
  initTrack (container, color) {
    this.trackContainer = document.createElement('div')
    this.trackContainer.classList.add('col')
    this.trackContainer.classList.add('notes_col')
    this.trackContainer.classList.add(`${color}_color`)
    container.appendChild(this.trackContainer)
    for (let i = 0; i < 16; ++i) {
      const div = document.createElement('div')
      div.className = 'note'
      div.classList.add('note_off')
      div.addEventListener('click', () => {
        asafonov.messageBus.send(asafonov.events.TRACK_VIEW_UPDATED, {name: this.name, index: i});
      })
      this.trackContainer.appendChild(div)
    }
  }
  onTrackModelUpdate (data) {
    if (data.name !== this.name)
      return
    const div = this.trackContainer.getElementsByTagName('div')[data.index]
    const track = data.value
    div.classList.remove('note_off')
    div.classList.remove('note_on')
    div.classList.add(`note_o${track ? 'n' : 'ff'}`)
  }
  onSpeakerClick() {
    asafonov.messageBus.send(asafonov.events.SPEAKER_VIEW_UPDATED, {name: this.name});
  }
  onVolumeRowChange (event) {
    const total = event.target.offsetWidth
    const current = event.layerX
    const volume = current / total * asafonov.settings.volume.max / asafonov.settings.volume.default
    asafonov.messageBus.send(asafonov.events.VOLUME_VIEW_UPDATED, {name: this.name, volume: volume});
  }
  onVolumeModelUpdate (data) {
    if(data.name !== this.name)
      return
    this.speakerContainer.classList[data.isMuted ? 'add' : 'remove']('speaker_off')
    this.displayVolume(data.volume)
  }
  destroy() {
    this.removeEventListeners()
    this.trackContainer.innerHTML = ''
    this.trackContainer = null
    this.volumeRowContainer.innerHTML = ''
    this.volumeRowContainer = null
    this.speakerContainer = null
    this.name = null
  }
}
class DrumTrackListView {
  constructor (list) {
    this.container = document.querySelector('.drumtrack')
    this.views = []
    for (let i = 0; i < list.length; ++i) {
      this.views.push(new DrumTrackView(list[i], asafonov.colors[i % asafonov.colors.length], this.container))
    }
    this.hide()
  }
  hide() {
    this.container.style.display = 'none'
  }
  show() {
    this.container.style.display = 'flex'
  }
  destroy() {
    for (let i = 0; i < this.views.length; ++i)
      this.views.destroy()
    this.container = null
  }
}
class InstrumentNoteTrackView {
  constructor (name, note, color, parentContainer) {
    this.name = name
    this.note = note
    this.container = document.createElement('div')
    this.container.classList.add('row')
    this.container.classList.add('notes_row')
    parentContainer.appendChild(this.container)
    this.initNote()
    this.initTrack(color)
    this.addEventListeners()
  }
  addEventListeners() {
    asafonov.messageBus.subscribe(asafonov.events.TRACK_MODEL_UPDATED, this, 'onTrackModelUpdate')
  }
  removeEventListeners() {
    asafonov.messageBus.unsubscribe(asafonov.events.TRACK_MODEL_UPDATED, this, 'onTrackModelUpdate')
  }
  initNote() {
    this.nameContainer = document.createElement('div')
    this.nameContainer.classList.add('col')
    this.nameContainer.classList.add('names_col')
    this.nameContainer.classList.add('name')
    this.nameContainer.innerHTML = this.note.replace('_', '#')
    this.container.appendChild(this.nameContainer)
  }
  initTrack (color) {
    this.trackContainer = document.createElement('div')
    this.trackContainer.classList.add('col')
    this.trackContainer.classList.add('notes_col')
    this.trackContainer.classList.add(`${color}_color`)
    this.container.appendChild(this.trackContainer)
    for (let i = 0; i < 16; ++i) {
      const div = document.createElement('div')
      div.className = 'note'
      div.classList.add('note_off')
      div.addEventListener('click', () => {
        asafonov.messageBus.send(asafonov.events.TRACK_VIEW_UPDATED, {name: this.name, note: this.note, index: i});
      })
      this.trackContainer.appendChild(div)
    }
  }
  onTrackModelUpdate (data) {
    if (data.name !== this.name || data.note !== this.note) {
      return
    }
    const div = this.trackContainer.getElementsByTagName('div')[data.index]
    div.classList.remove('note_off')
    div.classList.remove('note_on')
    div.classList.add(`note_o${data.value ? 'n' : 'ff'}`)
  }
  destroy() {
    this.removeEventListeners()
    this.trackContainer.innerHTML = ''
    this.trackContainer = null
    this.nameContainer = null
    this.container = null
    this.name = null
    this.note = null
  }
}
class InstrumentTrackView {
  constructor (name) {
    this.container = document.querySelector('.instrument')
    this.views = []
    let i = 0
    for (let k in asafonov.notes) {
      this.views.push(new InstrumentNoteTrackView(name, k, asafonov.colors[i % asafonov.colors.length], this.container))
      ++i
    }
    this.hide()
  }
  hide() {
    this.container.style.display = 'none'
  }
  show() {
    this.container.style.display = 'flex'
  }
  destroy() {
    for (let i = 0; i < this.views.length; ++i)
      this.views[i].destroy()
    this.views = null
    this.container = null
  }
}
class TempoView {
  constructor() {
    this.number = document.querySelector('.tempo .number')
    this.minus = document.querySelector('.tempo .icon_minus')
    this.plus = document.querySelector('.tempo .icon_plus')
    this.onMinusClickProxy = this.onMinusClick.bind(this)
    this.onPlusClickProxy = this.onPlusClick.bind(this)
    this.addEventListeners()
    this.updateNumber()
  }
  onMinusClick() {
    asafonov.messageBus.send(asafonov.events.TEMPO_DECREASE_REQUEST)
  }
  onPlusClick() {
    asafonov.messageBus.send(asafonov.events.TEMPO_INCREASE_REQUEST)
  }
  addEventListeners() {
    this.minus.addEventListener('click', this.onMinusClickProxy)
    this.plus.addEventListener('click', this.onPlusClickProxy)
    asafonov.messageBus.subscribe(asafonov.events.TEMPO_CHANGED, this, 'updateNumber')
  }
  removeEventListeners() {
    this.minus.removeEventListener('click', this.onMinusClickProxy)
    this.plus.removeEventListener('click', this.onPlusClickProxy)
    asafonov.messageBus.unsubscribe(asafonov.events.TEMPO_CHANGED, this, 'updateNumber')
  }
  updateNumber() {
    this.number.innerHTML = asafonov.settings.tempo
  }
  destroy() {
    this.removeEventListeners()
    this.number = null
    this.minus = null
    this.plus = null
  }
}
class TrackView {
  constructor (data) {
    this.container = document.querySelector('.tracks')
    this.instruments = {}
    if (data.drums) {
      this.instruments.drums = {
        view: new DrumTrackListView(data.drums),
        container: this.container.querySelector('.drums')
      }
      this.instruments.drums.container.style.display = 'flex'
    }
    if (data.instruments) {
      for (let i = 0; i < data.instruments.length; ++i) {
        this.instruments[data.instruments[i]] = {
          view: new InstrumentTrackView(data.instruments[i]),
          container: this.container.querySelector(`.${data.instruments[i]}`)
        }
        this.instruments[data.instruments[i]].container.style.display = 'flex'
      }
    }
    this.onTrackClickProxy = this.onTrackClick.bind(this)
    this.addEventListeners()
  }
  addEventListeners() {
    for (let i in this.instruments) {
      this.instruments[i].container.addEventListener('click', this.onTrackClickProxy)
    }
  }
  removeEventListeners() {
    for (let i in this.instruments) {
      this.instruments[i].container.removeEventListener('click', this.onTrackClickProxy)
    }
  }
  hide() {
    for (let i in this.instruments) {
      this.instruments[i].container.style.display = 'none'
    }
  }
  show() {
    for (let i in this.instruments) {
      this.instrument[i].container.style.display = 'flex'
    }
  }
  onTrackClick (event) {
    const instrument = event.currentTarget.getAttribute('data-instrument')
    this.instruments[instrument].view.show()
    this.hide()
  }
  destroy() {
    this.removeEventListeners()
    for (let i in this.instruments) {
      this.instruments[i].view.destroy()
      this.instruments[i].view = null
      this.instruments[i].container = null
      this.instruments[i] = null
    }
    this.instruments = null
    this.container = null
  }
}
class UpdaterView {
  constructor (upstreamVersionUrl, updateUrl) {
    this.model = new Updater(upstreamVersionUrl)
    this.updateUrl = updateUrl
  }
  showUpdateDialogIfNeeded() {
    this.model.isUpdateNeeded()
      .then(isUpdateNeeded => {
        if (isUpdateNeeded) this.showUpdateDialog()
      })
  }
  showUpdateDialog() {
    if (confirm('New version available. Do you want to update the App?')) location.href = this.model.getUpdateUrl(this.updateUrl)
  }
}
window.asafonov = {}
window.asafonov.version = '0.1'
window.asafonov.messageBus = new MessageBus()
window.asafonov.events = {
  TRACK_MODEL_UPDATED: 'TRACK_MODEL_UPDATED',
  TRACK_VIEW_UPDATED: 'TRACK_VIEW_UPDATED',
  IS_PLAYING_UPDATED: 'IS_PLAYING_UPDATED',
  SPEAKER_VIEW_UPDATED: 'SPEAKER_VIEW_UPDATED',
  VOLUME_MODEL_UPDATED: 'VOLUME_MODEL_UPDATED',
  VOLUME_VIEW_UPDATED: 'VOLUME_VIEW_UPDATED',
  TEMPO_INCREASE_REQUEST: 'TEMPO_INCREASE_REQUEST',
  TEMPO_DECREASE_REQUEST: 'TEMPO_DECREASE_REQUEST',
  TEMPO_CHANGED: 'TEMPO_CHANGED'
}
window.asafonov.notes = notes
window.asafonov.waveUtils = waveUtils
window.asafonov.colors = ['red', 'green', 'yellow', 'green2', 'blue', 'blue2', 'violet']
window.asafonov.settings = {
  tempo: 100,
  volume: {
    default: 15,
    max: 20
  }
}
window.onerror = (msg, url, line) => {
  alert(`${msg} on line ${line}`)
}
document.addEventListener("DOMContentLoaded", function (event) {
  const updaterView = new UpdaterView('https://raw.githubusercontent.com/asafonov/sunrise/master/VERSION.txt', 'https://github.com/asafonov/sunrise.apk/releases/download/{VERSION}/app-release.apk')
  updaterView.showUpdateDialogIfNeeded()
  const data = {
    drums: ['kick', 'hihat', 'snare', 'low_tom', 'medium_tom', 'high_tom', 'crash'],
    instruments: ['rocky_guitar']
  }
  const controller = new TrackController(data)
  const tempoController = new TempoController()
  const view = new TrackView(data)
  const controls = ['play', 'stop']
  const controlView = new ControlListView(controls)
  const tempoView = new TempoView()
})
