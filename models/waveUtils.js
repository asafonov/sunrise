const waveUtils = {
  url: null,

  normalize: v => v >= 0 ? Math.min(v, 256 * 128 - 1) : Math.max(v, -256 * 128 + 1) + 256 * 256 -1,

  getInterval : tempo => 60 / tempo / 4 * 1000,

  formatSize: size => {
    const ret = [size % 256]
    ret.push((size - ret[0]) / 256 % 256)
    ret.push((size - ret[0] - ret[1] * 256) / 256 / 256 % 256)
    ret.push((size - ret[0] - ret[1] * 256 - ret[2] * 256 * 256) / 256 / 256 / 256 % 256)
    return ret
  },

  updateVolume: (wav, volume) => {
    let i = 0
    const ret = []

    while (i < wav.length) {
      let v = wav[i] + wav[i + 1] * 256

      if (v > 256 * 128 - 1) v = v - 256*256 + 1

      v = v * volume
      v = waveUtils.normalize(v)
      const first = v % 256
      const second = (v - first) / 256
      ret.push(first)
      ret.push(second)
      i += 2
    }

    return ret
  },

  pitch: (wav, ratio) => {
    const bytesPerStep = 2
    let p = 0
    let i = 0
    const ret = []

    while (i < wav.length) {
      const n = parseInt(i / bytesPerStep * (1 - ratio))

      if (n > p) {
        p = n
      } else {
        for (let j = 0; j < bytesPerStep; ++j)
          ret.push(wav[i + j])
      }

      i += bytesPerStep
    }

    return ret
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
    const audio = new Audio()

    if (bytes !== null && bytes !== undefined) {
      const buffer = new Uint8Array(bytes.length + 44)
      buffer.set(new Uint8Array([...waveUtils.getWavHeader(bytes.length), ...bytes]), 0)
      const blob = new Blob([buffer], {type: 'audio/wav'})
      waveUtils.url = URL.createObjectURL(blob)
    }

    audio.src = waveUtils.url
    audio.play()
  }
}
