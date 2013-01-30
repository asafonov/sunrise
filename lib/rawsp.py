# --- rawsp module --- #
# --- Alexander Safonov <me@asafonov.org> --- #
# --- provides class for accessing audio device and processing RAW files --- #
try:
    from lib.rawsp_alsaaudio import RawSoundProcessor
except:
    from lib.rawsp_qtmultimedia import RawSoundProcessor
from datetime import datetime

class RawSoundProcessorBase(RawSoundProcessor):

    # --- constructor --- #
    def __init__(self, filename='', program_filename=''):
        if filename=='':
            filename = program_filename+'tmp/'+datetime.now().strftime('%Y%m%d%H%M%S')+'.raw'
        self.program_filename = program_filename
        self.setFilename(filename)

    # --- filename setter --- #
    def setFilename(self, filename):
        self.filename = filename

    # --- wav_filename setter --- #
    def setWavFilename(self, wav_filename):
        self.wav_filename = wav_filename
