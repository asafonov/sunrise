const waveUtils = {
  url: null,

  normalize: v => v >= 0 ? Math.min(v, 256 * 128 - 1) : Math.max(v, -256 * 128 + 1) + 256 * 256 -1,

  getInterval : tempo => 60 / tempo / 4 * 1000,

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

  pitch: (wav, ratio, channels = 2, bytesPerSample = 2) => {
    const frame = channels * bytesPerSample
    const inFrames = Math.floor(wav.length / frame)
    const outFrames = Math.floor(inFrames / ratio)
    const ret = []
    const readSample = (f, off) => {
      const b = f * frame + off
      let v = wav[b] + wav[b + 1] * 256

      if (v > 32767) v += -65536

      return v
    }

    for (let j = 0; j < outFrames; ++j) {
      const t = j * ratio
      const i0 = Math.floor(t)
      const frac = t - i0

      for (let c = 0; c < channels; ++c) {
        const off = c * bytesPerSample
        const v0 = readSample(i0, off)
        const v1 = readSample(i0 + 1, off)
        let v = Math.round(v0 + (v1 - v0) * frac)
        v = Math.max(-32768, Math.min(32767, v))
        ret.push(v & 0xff, (v >> 8) & 0xff)
      }
    }

    return ret
  },

  asFourBytes: size => {
    const ret = [size % 256]
    ret.push(((size - ret[0]) / 256) % 256)
    ret.push(((size - ret[0] - ret[1] * 256) / 256 / 256) % 256)
    ret.push(((size - ret[0] - ret[1] * 256 - ret[2] * 256 * 256) / 256 / 256 / 256) % 256)
    return ret
  },

  getWavHeader: (length, channels = 2, sampleRate = 44100) => {
    return [
      82, 73, 70, 70, //FileTypeBlocID (4 bytes) : Identifier « RIFF »  (0x52, 0x49, 0x46, 0x46)
      ...waveUtils.asFourBytes(length + 44), //FileSize (4 bytes) : Overall file size minus 8 bytes
      87, 65, 86, 69, //FileFormatID (4 bytes) : Format = « WAVE »  (0x57, 0x41, 0x56, 0x45)
      102, 109, 116, 32, //FormatBlocID (4 bytes) : Identifier « fmt␣ »  (0x66, 0x6D, 0x74, 0x20)
      16, 0, 0, 0, //BlocSize (4 bytes) : Chunk size minus 8 bytes, which is 16 bytes here  (0x10)
      1, 0, //AudioFormat (2 bytes) : Audio format (1: PCM integer, 3: IEEE 754 float)
      channels, 0, //NbrChannels (2 bytes) : Number of channels
      ...waveUtils.asFourBytes(sampleRate), //Frequency (4 bytes) : Sample rate (in hertz)
      ...waveUtils.asFourBytes(sampleRate * channels * 2), //BytePerSec (4 bytes) : Number of bytes to read per second (Frequency * BytePerBloc).
      channels * 2, 0, //BytePerBloc (2 bytes) : Number of bytes per block (NbrChannels * BitsPerSample / 8).
      16, 0, //BitsPerSample (2 bytes) : Number of bits per sample
      100, 97, 116, 97, //DataBlocID (4 bytes) : Identifier « data »  (0x64, 0x61, 0x74, 0x61)
      ...waveUtils.asFourBytes(length) //DataSize (4 bytes) : SampledData size
    ]
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
