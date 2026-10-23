class LoopController {

  constructor() {
    this.addEventListeners()
  }

  addEventListeners() {
    asafonov.messageBus.subscribe(asafonov.events.NEXT_LOOP_REQUEST, this, 'onNextLoopRequest')
    asafonov.messageBus.subscribe(asafonov.events.PREV_LOOP_REQUEST, this, 'onPrevLoopRequest')
  }

  removeEventListeners() {
    asafonov.messageBus.unsubscribe(asafonov.events.NEXT_LOOP_REQUEST, this, 'onNextLoopRequest')
    asafonov.messageBus.unsubscribe(asafonov.events.PREV_LOOP_REQUEST, this, 'onPrevLoopRequest')
  }

  onNextLoopRequest() {
    asafonov.loopNumber++
    asafonov.messageBus.send(asafonov.events.LOOP_UPDATED)
  }

  onPrevLoopRequest() {
    if (asafonov.loopNumber > 0) {
      asafonov.loopNumber--
      asafonov.messageBus.send(asafonov.events.LOOP_UPDATED)
    }
  }

  destroy() {
    this.removeEventListeners()
  }
}
