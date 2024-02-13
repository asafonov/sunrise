const waveUtils = {
  audio: new Audio(),

  normalize: v => v >= 0 ? Math.min(v, 256 * 128 - 1) : Math.max(v, -256 * 128 + 1) + 256 * 256 -1,

  formatSize: size => {
    const ret = [size % 256]
    ret.push((size - ret[0]) / 256 % 256)
    ret.push((size - ret[0] - ret[1] * 256) / 256 / 256 % 256)
    ret.push((size - ret[0] - ret[1] * 256 - ret[2] * 256 * 256) / 256 / 256 / 256 % 256)
    return ret
  },

  pitch: (wav, ratio) => {
    let p = 0
    return wav.filter((v, i) => {
      const n = parseInt(i * (1 - ratio))

      if (n > p) {
        p = n
        return false
      }

      return true
    })
  },

  getWavHeader: length => {
    return [82, 73, 70, 70,
          ...waveUtils.formatSize(length + 44),
          87, 65, 86, 69,
          102, 109, 116, 32,
          16, 0, 0, 0,
          1, 0, 2, 0,
          68, 172, 0, 0,
          16, 177, 2, 0,
          4, 0, 16, 0,
          100, 97, 116, 97,
          ...waveUtils.formatSize(length)]
  },

  mixWavs: (wavs, starts) => {
    wavs = wavs.filter(i => i && i.length > 0)
    if (starts === null || starts === undefined) starts = []
    let length = 0

    for (let i = 0; i < wavs.length; ++i) {
      length = Math.max(wavs[i].length + (starts[i] || 0), length)
    }

    let i = 0
    const ret = []

    while (i < length - 1) {
      let res = 0

      for (let j = 0; j < wavs.length; ++j) {
        const b0 = ! starts[j] || i >= starts[j] ? wavs[j][i - (starts[j] || 0)] || 0 : 0
        const b1 = ! starts[j] || i >= starts[j] ? wavs[j][i + 1 - (starts[j] || 0)] || 0 : 0
        let v = b0 + b1 * 256

        if (v > 256 * 128 - 1) v = v - 256*256 + 1

        res += v
      }

      res = waveUtils.normalize(res)
      const first = res % 256
      const second = (res - first) / 256
      ret.push(first)
      ret.push(second)
      i += 2
    }

    return ret
  },

  play: bytes => {
    if (bytes !== null && bytes !== undefined) {
      const buffer = new Uint8Array(bytes.length + 44)
      buffer.set(new Uint8Array([...waveUtils.getWavHeader(bytes.length), ...bytes]), 0)
      const blob = new Blob([buffer], {type: 'audio/wav'})
      const url = URL.createObjectURL(blob)
      waveUtils.audio.src = url
    }

    waveUtils.audio.play()
  }
}
