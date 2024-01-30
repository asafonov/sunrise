window.asafonov = {}
window.asafonov.version = '0.1'
window.asafonov.messageBus = new MessageBus()
window.asafonov.events = {
  TRACK_MODEL_UPDATED: 'TRACK_MODEL_UPDATED',
  TRACK_VIEW_UPDATED: 'TRACK_VIEW_UPDATED',
  IS_PLAYING_UPDATED: 'IS_PLAYING_UPDATED'
}
window.asafonov.utils = {
  normalize: v => (v > 0 ? Math.min(v, 256 * 128 - 1) : Math.max(v, -256 * 128 + 1)) + 256 * 128,

  formatSize: size => {
    const ret = [size % 256]
    ret.push((size - ret[0]) / 256 % 256)
    ret.push((size - ret[0] - ret[1] * 256) / 256 / 256 % 256)
    ret.push((size - ret[0] - ret[1] * 256 - ret[2] * 256 * 256) / 256 / 256 / 256 % 256)
    return ret
  },

  getWavHeader: v => {
    return [82, 73, 70, 70,
          ...asafonov.utils.formatSize(v.length + 44),
          87, 65, 86, 69,
          102, 109, 116, 32,
          16, 0, 0, 0,
          1, 0, 2, 0,
          68, 172, 0, 0,
          16, 177, 2, 0,
          4, 0, 16, 0,
          100, 97, 116, 97,
          ...asafonov.utils.formatSize(v.length)]
  },

  mergeWavs: wavs => {
    let length = wavs.reduce((a, v) => Math.max(a, v.length), 0)
    let i = 44
    const ret = []

    while (i < length - 1) {
      let res = 0

      for (let j = 0; j < wavs.length; ++j) {
        res += (wavs[j][i] || 0) + (wavs[j][i + 1] || 0) * 256 - 256 * 128
      }

      res = asafonov.utils.normalize(res)
      const first = res % 256
      const second = (res - first) / 256
      ret.push(first)
      ret.push(second)
      i += 2
    }

    return [...asafonov.utils.getWavHeader(ret), ...ret]
  },

  play: bytes => {
    const buffer = new Uint8Array(bytes.length)
    buffer.set(new Uint8Array(bytes), 0)
    const blob = new Blob([buffer], {type: 'audio/wav'})
    const url = URL.createObjectURL(blob)
    const audio = new Audio()
    audio.src = url
    audio.play()
  }
}
window.asafonov.settings = {
}
window.onerror = (msg, url, line) => {
  alert(`${msg} on line ${line}`)
}
