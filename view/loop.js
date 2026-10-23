class LoopView {
  constructor() {
    this.previousButton = document.querySelector('.previous')
    this.nextButton = document.querySelector('.next')
    this.loopContainer = document.querySelector('.present')
    this.displayLoop()
    this.onNextClickProxy = this.onNextClick.bind(this)
    this.onPrevClickProxy = this.onPrevClick.bind(this)
  }

  addEventListeners() {
    this.previousButton.addEventListener('click', this.onPrevClickProxy)
    this.nextButton.addEventListener('click', this.onNextClickProxy)
    asafonov.messageBus.subscribe(asafonov.events.LOOP_UPDATED, this, 'onLoopUpdate')
  }

  removeEventListeners() {
    this.previousButton.removeEventListener('click', this.onPrevClickProxy)
    this.nextButton.removeEventListener('click', this.onNextClickProxy)
    asafonov.messageBus.unsubscribe(asafonov.events.LOOP_UPDATED, this, 'onLoopUpdate')
  }

  onNextClick() {
    asafonov.messageBus.send(asafonov.events.NEXT_LOOP_REQUEST)
  }

  onPrevClick() {
    asafonov.messageBus.send(asafonov.events.PREV_LOOP_REQUEST)
  }

  onLoopUpdate() {
    this.displayLoop()
  }

  displayLoop() {
    this.loopContainer.innerHTML = asafonov.loopNumber
  }

  destroy() {
    this.removeEventListeners()
    this.previousButton = null
    this.nextButton = null
    this.loopContainer = null
  }
}
