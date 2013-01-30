# --- rawsp module --- #
# --- Alexander Safonov <me@asafonov.org> --- #
# --- provides class for accessing audio device and processing RAW files --- #
import os, alsaaudio, wave, threading, time

class RawSoundProcessor:
    status = 0 # status of the audio device: 0-stopped; 1-playing; 2-recording
    filename = '' # RAW file for saving data from the audio device
    wav_filename = '' # WAV file for playing with the audio device
    loop = 0 # loop playing needed
    card = 'default' # soundcard alias
    device = None # audio output device

    # --- returns the format of the RAW file --- #
    def getFormat(self):
        format = {}
        format['nchannels'] = 2
        format['framerate'] = 44100
        format['sampwidth'] = alsaaudio.PCM_FORMAT_S16_LE
        return format

    # --- stops current audio device action (playing/recording)
    def stopPlayRecord(self):
        # if recording
        if self.status==2:
            # stopping audio device
            self.status = 0
            time.sleep(0.01)
            # converting current RAW file to WAV and setting it as self.wav_filename
            wav = wave.open(self.filename.replace('.raw', '.wav'), 'wb')
            wav.setnchannels(2)
            wav.setsampwidth(2)
            wav.setframerate(44100)
            f = open(self.filename, 'rb')
            wav.writeframes(f.read())
            f.close()
            wav.close()
            self.wav_filename = self.filename.replace('.raw', '.wav')
            # deleting current RAW file
            os.remove(self.filename)
            # the method returns the name of the recorder file if there was recording
            return self.wav_filename
        # if playing
        if self.status==1:
            # stopping audio device
            self.status = 0
            time.sleep(0.01)
        # set status to stopped
        self.status = 0
        return ''

    # --- actual recording with ALSA API --- #
    def record(self):
        format = self.getFormat()
        f = open(self.filename, 'wb')
        inp = alsaaudio.PCM(alsaaudio.PCM_CAPTURE, alsaaudio.PCM_NONBLOCK, self.card)
        inp.setchannels(format['nchannels'])
        inp.setrate(format['framerate'])
        inp.setformat(format['sampwidth'])
        inp.setperiodsize(160)
        loops = 1000000
        while loops > 0 and self.status==2:
            loops -= 1
            # Read data from device
            l, data = inp.read()
            if l:
                f.write(data)
                time.sleep(.001)

    def playBytes(self, data):
        # if nothing was played before - creating audio device
        if self.device == None:
            self.device = alsaaudio.PCM(card=self.card)
            format=self.getFormat()
            self.device.setchannels(format['nchannels'])
            self.device.setrate(format['framerate'])
            self.device.setformat(format['sampwidth'])
        if self.status == 0:
            self.readed_bytes = 0
            self.data = data
            threading.Thread(target=self.playBytesData).start()
        else:
            #self.data.append(data)
            self.data += data
        self.status = 1

    def playBytesData(self):
        self.device.setperiodsize(320)
        while self.readed_bytes<len(self.data):
            self.device.write(self.data[self.readed_bytes:min(self.readed_bytes+320, len(self.data))])
            self.readed_bytes = self.readed_bytes+320
        self.status = 0

    # --- actual playing with ALSA API --- #
    def play(self, filename):
        self.device = alsaaudio.PCM(card=self.card)
        is_wav = filename.find('.wav')
        if is_wav>0:
            f = wave.open(filename, 'rb')
            # Set attributes
            self.device.setchannels(f.getnchannels())
            self.device.setrate(f.getframerate())
            # 8bit is unsigned in wav files
            if f.getsampwidth() == 1:
                self.device.setformat(alsaaudio.PCM_FORMAT_U8)
            # Otherwise we assume signed data, little endian
            elif f.getsampwidth() == 2:
                self.device.setformat(alsaaudio.PCM_FORMAT_S16_LE)
            elif f.getsampwidth() == 3:
                self.device.setformat(alsaaudio.PCM_FORMAT_S24_LE)
            elif f.getsampwidth() == 4:
                self.device.setformat(alsaaudio.PCM_FORMAT_S32_LE)
            else:
                raise ValueError('Unsupported format')
        else:
            f = open(filename, 'rb')
            format=self.getFormat()
            self.device.setchannels(format['nchannels'])
            self.device.setrate(format['framerate'])
            self.device.setformat(format['sampwidth'])

        self.device.setperiodsize(320)
        if is_wav>0:
            data = f.readframes(320)
        else:
            data = f.read(320*4)
        while data and self.status==1:
            # Read data from stdin
            self.device.write(data)
            if is_wav>0:
                data = f.readframes(320)
            else:
                data = f.read(320*4)
        self.stateChanged()

    # --- starting the recording from the audio device --- #
    def startRecording(self):
        # setting up status to recording
        self.status = 2
        threading.Thread(target=self.record).start()

    # --- state of the output changed event handler. If loop then plays once again --- #
    def stateChanged(self):
        if self.loop==1 and self.status==1:
            self.startPlaying('', 1)

    # --- starting playing of the wav file --- #
    def startPlaying(self, filename='', loop=0):
        self.loop = loop
        self.stopPlayRecord()
        # setting up status to playing
        self.status = 1
        # if no filename for playing specified - playing self.wav_filename
        if filename == '':
            filename = self.wav_filename
        # starting recording
        threading.Thread(target=self.play, args=(filename,)).start()
