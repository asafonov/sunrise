class ControlView {

  constructor (name, parentContainer) {
    this.name = name
    this.container = document.createElement('div')
    this.container.classList.add('icon')
    this.container.classList.add(`icon_${name}`)
    this.container.classList.add(this.getClassByIsPlaying())
    this.container.innerHTML = this.getIcon()
    parentContainer.appendChild(this.container)
    this.addEventListeners()
  }

  getIcon() {
    if (this.name === 'play') return '▶'
    if (this.name === 'pause') return '❙&#8201;❙'
    if (this.name === 'stop') return '■'
  }

  addEventListeners() {
    asafonov.messageBus.subscribe(asafonov.events.IS_PLAYING_UPDATED, this, 'onIsPlayingUpdate')
  }

  removeEventListeners() {
    asafonov.messageBus.unsubscribe(asafonov.events.IS_PLAYING_UPDATED, this, 'onIsPlayingUpdate')
  }

  getClassByIsPlaying (isPlaying) {
    if (isPlaying) {
      return this.name === 'play' ? 'icon_off' : 'icon_on'
    }

    return this.name === 'play' ? 'icon_on' : 'icon_off'
  }

  onIsPlayingUpdate (data) {
  }

  destroy() {
    this.removeEventListeners()
    this.container = null
    this.name = null
  }

}
