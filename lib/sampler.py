# --- sampler module --- #
# --- Alexander Safonov <me@asafonov.org> --- #
# --- provides funtions for processing samples --- #

import os, struct, ctypes

class sampler:

    notes = {} # notes frequency
    instrument = '' # current instrument
    samples_folder = 'samples'

    def __init__(self, instrument, program_folder=''):
        self.program_folder = program_folder
        self.samples_folder = program_folder+self.samples_folder
        self.setInstrument(instrument)
        self.notes['C'] = 262
        self.notes['C#'] = 277
        self.notes['D'] = 294
        self.notes['D#'] = 311
        self.notes['E'] = 330
        self.notes['F'] = 349
        self.notes['F#'] = 370
        self.notes['G'] = 392
        self.notes['G#'] = 415
        self.notes['A'] = 440
        self.notes['Bb'] = 466
        self.notes['H'] = 494

    def setInstrument(self, instrument):
        self.instrument = instrument

    def changeTone(self, v_to, v_from='C'):
        folder_name = self.samples_folder+'/'+self.instrument.lower()
        to_filename = v_to.lower().replace('#', 's')+'.raw'
        from_filename = v_from.lower().replace('#', 's')+'.raw'
        f = open(folder_name+'/'+from_filename, 'rb')
        spam = f.read()
        f.close()
        i = 0
        ratio = float(self.notes[v_to])/self.notes[v_from]
        out = ctypes.create_string_buffer(int(float(len(spam))/ratio))
        while i<int(float(len(spam))/ratio):
            j = int(float(ratio)*i)
            j += i%4 - j%4
            if j+6<=len(spam):
                tmp1 = struct.unpack('h', spam[j:j+2])[0]
                tmp2 = struct.unpack('h', spam[j+4:j+6])[0]
                tmp = int(tmp1+(tmp2-tmp1)*(ratio-1))
                if tmp>256**2:
                    tmp = 256**2
                elif tmp<-256**2:
                    tmp = -256**2
                struct.pack_into('h', out, i, tmp)
            i = i+2
        f = open(folder_name+'/'+to_filename, 'wb')
        f.write(out)
        f.close()

    def getNoteFilename(self, note):
        folder_name = self.samples_folder+'/'+self.instrument.lower()
        filename = folder_name+'/'+note.lower().replace('#', 's')+'.raw'
        if not os.path.exists(filename):
            self.changeTone(note)
        return filename
