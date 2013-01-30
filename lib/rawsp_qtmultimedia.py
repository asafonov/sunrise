# --- rawsp module --- #
# --- Alexander Safonov <me@asafonov.org> --- #
# --- provides class for accessing audio device and processing RAW files --- #
from PyQt4 import QtCore, QtMultimedia
#from datetime import datetime
import os, wave

class RawSoundProcessor:
    status = 0 # status of the audio device: 0-stopped; 1-playing; 2-recording
    filename = '' # RAW file for saving data from the audio device
    wav_filename = '' # WAV file for playing with the audio device
    loop = 0 # loop playing needed
    audio_output = None

    # --- returns the format of the RAW file --- #
    def getFormat(self):
        format = QtMultimedia.QAudioFormat()
        format.setFrequency(44100)
        format.setChannels(2)
        format.setSampleSize(16)
        format.setCodec("audio/pcm")
        format.setByteOrder(QtMultimedia.QAudioFormat.LittleEndian);
        format.setSampleType(QtMultimedia.QAudioFormat.SignedInt);
        return format

    # --- stops current audio device action (playing/recording)
    def stopPlayRecord(self):
        # if recording
        if self.status==2:
            # stopping audio device and closing RAW file
            self.ofile.close()
            self.audio_input.stop()
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
            self.status = 0
            # the method returns the name of the recorder file if there was recording
            return self.wav_filename
        # if playing
        if self.status==1:
            # stopping audio device
            self.audio_output.stop()
        # set status to stopped
        self.status = 0
        return ''
        
    # --- starting the recording from the audio device --- #
    def startRecording(self):
        # setting up status to recording
        self.status = 2
        # opening current RAW file for writing data from the audio device
        self.ofile = QtCore.QFile(self.filename)
        self.ofile.open( QtCore.QIODevice.WriteOnly | QtCore.QIODevice.Truncate )
        # setting up format for the recording
        format = self.getFormat()
        self.audio_input = QtMultimedia.QAudioInput(format, None)
        # starting the recording
        self.audio_input.start(self.ofile)

    # --- state of the output changed event handler. If loop then plays once again --- #
    def stateChanged(self):
        if self.loop==1 and self.status==1:
            self.startPlaying('', 1)
        elif self.status==1 or self.status==1:
            self.status = 0

    # --- playing bytes from memory --- #
    def playBytes(self, data):
        # if nothing was played before - creating audio device
        if self.audio_output==None:
            format = self.getFormat()
            self.audio_output = QtMultimedia.QAudioOutput(format, None)
        # if nothing is playing right now - creating new buffer to play
        if self.status == 0:
            self.play_data = QtCore.QBuffer()
            self.play_data.setData(QtCore.QByteArray().append(data))
            self.play_data.open(QtCore.QIODevice.ReadOnly)
            self.audio_output.start(self.play_data)
        # esle adding data to the existing buffer
        else:
            self.play_data.close()
            self.play_data.open(QtCore.QIODevice.Append)
            self.play_data.writeData(QtCore.QByteArray().append(data))
            self.play_data.close()
            self.play_data.open(QtCore.QIODevice.ReadOnly)
        # setting status to playing
        self.status = 1

    # --- starting playing of the wav file --- #
    def startPlaying(self, filename='', loop=0):
        self.loop = loop
        # setting up status to playing
        self.status = 1
        # if no filename for playing specified - playing self.wav_filename
        if filename == '':
            filename = self.wav_filename
        # opening wav file
        self.ifile = QtCore.QFile(filename)
        self.ifile.open(QtCore.QIODevice.ReadOnly)
        # setting up format for playing
        format = self.getFormat()
        self.audio_output = QtMultimedia.QAudioOutput(format, None)
        # start playing
        self.audio_output.start(self.ifile)
        self.audio_output.stateChanged.connect(self.stateChanged)

