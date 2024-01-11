class DrumTrackView {

  constructor (name, color, parentContainer) {
    this.controller = new DrumTrackController(name)
    this.container = document.createElement('div')
    this.container.classList.add('row')
    this.container.classList.add('notes_row')
    parentContainer.appendChild(this.container)
    this.initName()
    this.initTrack(color)
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
        asafonov.messageBus.send(asafonov.events.TRACK_VIEW_UPDATED, {name: this.controller.getModel().getName(), number: i});
      })
      this.trackContainer.appendChild(div)
    }
  }

  destroy() {
    this.controller.destroy()
    this.trackContainer.innerHTML = ''
    this.trackContainer = null
    this.nameContainer = null
    this.container = null
    this.controller = null
  }

}
