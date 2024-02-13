window.asafonov = {}
window.asafonov.version = '0.1'
window.asafonov.messageBus = new MessageBus()
window.asafonov.events = {
  TRACK_MODEL_UPDATED: 'TRACK_MODEL_UPDATED',
  TRACK_VIEW_UPDATED: 'TRACK_VIEW_UPDATED',
  IS_PLAYING_UPDATED: 'IS_PLAYING_UPDATED'
}
window.asafonov.notes = notes
window.asafonov.waveUtils = waveUtils
window.asafonov.settings = {
  tempo: 100
}
window.onerror = (msg, url, line) => {
  alert(`${msg} on line ${line}`)
}
