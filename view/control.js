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
