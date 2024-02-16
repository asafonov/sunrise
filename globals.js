window.asafonov = {}
window.asafonov.version = '0.1'
window.asafonov.messageBus = new MessageBus()
window.asafonov.events = {
  TRACK_MODEL_UPDATED: 'TRACK_MODEL_UPDATED',
  TRACK_VIEW_UPDATED: 'TRACK_VIEW_UPDATED',
  IS_PLAYING_UPDATED: 'IS_PLAYING_UPDATED',
  SPEAKER_VIEW_UPDATED: 'SPEAKER_VIEW_UPDATED',
  VOLUME_MODEL_UPDATED: 'VOLUME_MODEL_UPDATED'
}
window.asafonov.notes = notes
window.asafonov.waveUtils = waveUtils
window.asafonov.colors = ['red', 'green', 'yellow', 'green2', 'blue', 'blue2', 'violet']
window.asafonov.settings = {
  tempo: 100,
  volume: {
    default: 15,
    max: 20
  }
}
window.onerror = (msg, url, line) => {
  alert(`${msg} on line ${line}`)
}
