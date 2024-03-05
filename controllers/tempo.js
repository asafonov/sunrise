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
