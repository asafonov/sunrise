class DrumTrackView {

  constructor (name, color, parentContainer) {
    this.controller = new DrumTrackController(name)
    this.container = document.createElement('div')
    this.container.classList.add('row')
    this.container.classList.add('notes_row')
    parentContainer.appendChild(this.container)
    this.initName()
    this.initTrack(color)
    this.addEventListeners()
  }

  addEventListeners() {
    asafonov.messageBus.subscribe(asafonov.events.TRACK_MODEL_UPDATED, this, 'onTrackModelUpdate')
  }

  removeEventListeners() {
    asafonov.messageBus.unsubscribe(asafonov.events.TRACK_MODEL_UPDATED, this, 'onTrackModelUpdate')
  }

  initName() {
    this.nameContainer = document.createElement('div')
    this.nameContainer.classList.add('col')
    this.nameContainer.classList.add('names_col')
    this.nameContainer.classList.add('name')
    this.nameContainer.innerHTML = this.controller.getModel().getName()
    this.container.appendChild(this.nameContainer)
  }

  initTrack (color) {
    this.trackContainer = document.createElement('div')
    this.trackContainer.classList.add('col')
    this.trackContainer.classList.add('notes_col')
    this.trackContainer.classList.add(`${color}_color`)
    this.container.appendChild(this.trackContainer)
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
    this.nameContainer = null
    this.container = null
    this.controller = null
  }

}
