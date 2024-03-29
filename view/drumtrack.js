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
