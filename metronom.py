# --- Sunrise metronome tool --- #
# --- Alexander Safonov <me@asafonov.org> --- #
# --- Metronome tool --- #
import sys, os, time, struct, ctypes
from PyQt4 import QtCore, QtGui
from lib.rawsp import RawSoundProcessorBase

# --- Main window of the metronom --- #
class Metronome(QtGui.QDialog):
    
    status = 0 # Metronom status: # 0 - stopped, 1 - started
    rawsp = None # instance of the RAW sound processor

    # --- constructor --- #
    def __init__(self, program_folder=''):
        QtGui.QDialog.__init__(self, None)
        self.program_folder = program_folder
        # --- Main window settings --- #
        self.resize(200, 10)
        self.setWindowTitle('Metronome')
        self.setWindowIcon(QtGui.QIcon(self.program_folder+'img/icon.png'))
        vbox = QtGui.QVBoxLayout(self)
        label = QtGui.QLabel('Tempo:')
        self.tempo = QtGui.QSpinBox()
        self.tempo.setRange(10,1000)
        self.tempo.setValue(100)
        self.button = QtGui.QPushButton('Start')
        self.button.clicked.connect(self.processStartStop)
        vbox.addWidget(label)
        vbox.addWidget(self.tempo)
        vbox.addWidget(self.button)
        self.rawsp = RawSoundProcessorBase()

    # --- stopping Metronome --- #
    def stopMetronome(self):
        self.rawsp.stopPlayRecord()

    # --- starting Metronome --- #
    def startMetronome(self):
        tempo = self.tempo.value()
        # calculting the filesize of the one Metronome tick
        filesize = int(44100*4*60/tempo)
        # creating resulting Metronome tick file with given tempo
        f = open(self.program_folder+'sound/metronom.raw', 'rb')
        fw = open(self.program_folder+'tmp/metronom.raw', 'wb')
        # writing tick
        fw.write(f.read())
        f.close()
        # the length of the tick is 16320 so I add silence to fill the file
        out = ctypes.create_string_buffer(filesize-16320)
        i = 0
        while i<filesize-16320:
            struct.pack_into('h', out, i, 0)
            i = i+2
        fw.write(out)
        fw.close()
        # setting resulting file for playing
        self.rawsp.setWavFilename(self.program_folder+'tmp/metronom.raw')
        # start playing, looping
        self.rawsp.startPlaying('', 1)

    # --- processing start/stop button click --- #
    def processStartStop(self):
        # Metronome stopped - start playing
        if self.status == 0:
            self.status = 1
            self.button.setText('Stop')
            self.startMetronome()
        # else: stopping
        else:
            self.status = 0
            self.button.setText('Start')
            self.stopMetronome()
