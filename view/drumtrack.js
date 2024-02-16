class DrumTrackView {

  constructor (name, color, parentContainer) {
    this.controller = new DrumTrackController(name)
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
    this.addEventListeners()
  }

  addEventListeners() {
    asafonov.messageBus.subscribe(asafonov.events.TRACK_MODEL_UPDATED, this, 'onTrackModelUpdate')
  }

  removeEventListeners() {
    asafonov.messageBus.unsubscribe(asafonov.events.TRACK_MODEL_UPDATED, this, 'onTrackModelUpdate')
  }

  getController() {
    return this.controller
  }

  initName (container) {
    const nameContainer = document.createElement('div')
    nameContainer.classList.add('col')
    nameContainer.classList.add('names_col')
    nameContainer.classList.add('name')
    nameContainer.innerHTML = this.controller.getModel().getName()
    container.appendChild(nameContainer)
  }

  initVolume (volumeContainer) {
    this.volumeContainer = volumeContainer
    const speakerContainer = document.createElement('div')
    speakerContainer.className = 'speaker'
    this.volumeContainer.appendChild(speakerContainer)
    const volumeRowContainer = document.createElement('div')
    volumeRowContainer.classList.add('col')
    volumeRowContainer.classList.add('volume_row')
    this.volumeContainer.appendChild(volumeRowContainer)
    volumeRowContainer.innerHTML = '<div class="volume_item"></div>'
    volumeRowContainer.innerHTML += '<div class="volume_item"></div>'
    volumeRowContainer.innerHTML += '<div class="volume_item"></div>'
    volumeRowContainer.innerHTML += '<div class="volume_item"></div>'
  }

  initTrack (container, color) {
    this.trackContainer = document.createElement('div')
    this.trackContainer.classList.add('col')
    this.trackContainer.classList.add('notes_col')
    this.trackContainer.classList.add(`${color}_color`)
    container.appendChild(this.trackContainer)
    const track = this.controller.getModel().getTrack()

    for (let i = 0; i < track.length; ++i) {
      const div = document.createElement('div')
      div.className = 'note'
      div.classList.add(`note_o${track[i] ? 'n' : 'ff'}`)
      div.addEventListener('click', () => {
        asafonov.messageBus.send(asafonov.events.TRACK_VIEW_UPDATED, {name: this.controller.getModel().getName(), index: i});
      })
      this.trackContainer.appendChild(div)
    }
  }

  onTrackModelUpdate (data) {
    if (data.name !== this.controller.getModel().getName()) {
      return
    }

    const div = this.trackContainer.getElementsByTagName('div')[data.index]
    const track = this.controller.getModel().getTrack()[data.index]
    div.classList.remove('note_off')
    div.classList.remove('note_on')
    div.classList.add(`note_o${track ? 'n' : 'ff'}`)
  }

  destroy() {
    this.removeEventListeners()
    this.controller.destroy()
    this.trackContainer.innerHTML = ''
    this.trackContainer = null
    this.volumeContainer.innerHTML = ''
    this.volumeContainer = null
    this.controller = null
  }

}
