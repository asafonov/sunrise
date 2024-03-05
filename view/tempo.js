class TempoView {

  constructor() {
    this.number = document.querySelector('.tempo .number')
    this.minus = document.querySelector('.tempo .icon_minus')
    this.plus = document.querySelector('.tempo .icon_plus')
    this.onMinusClickProxy = this.onMinusClick.bind(this)
    this.onPlusClickProxy = this.onPlusClick.bind(this)
    this.addEventListeners()
    this.updateNumber()
  }

  onMinusClick() {
    asafonov.messageBus.send(asafonov.events.TEMPO_DECREASE_REQUEST)
  }

  onPlusClick() {
    asafonov.messageBus.send(asafonov.events.TEMPO_INCREASE_REQUEST)
  }

  addEventListeners() {
    this.minus.addEventListener('click', this.onMinusClickProxy)
    this.plus.addEventListener('click', this.onPlusClickProxy)
    asafonov.messageBus.subscribe(asafonov.events.TEMPO_CHANGED, this, 'updateNumber')
  }

  removeEventListeners() {
    this.minus.removeEventListener('click', this.onMinusClickProxy)
    this.plus.removeEventListener('click', this.onPlusClickProxy)
    asafonov.messageBus.unsubscribe(asafonov.events.TEMPO_CHANGED, this, 'updateNumber')
  }

  updateNumber() {
    this.number.innerHTML = asafonov.settings.tempo
  }

  destroy() {
    this.removeEventListeners()
    this.number = null
    this.minus = null
    this.plus = null
  }

}
