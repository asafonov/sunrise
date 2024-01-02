window.asafonov = {}
window.asafonov.version = '0.1'
window.asafonov.utils = new Utils()
window.asafonov.messageBus = new MessageBus()
window.asafonov.events = {
}
window.asafonov.settings = {
}
window.onerror = (msg, url, line) => {
  alert(`${msg} on line ${line}`)
}
