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
      div.classList.add(`note_off'}`)
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
