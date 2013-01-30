# --- drumProcessor module --- #
# --- Alexander Safonov <me@asafonov.org> --- #
# --- provides function for processing drumsets --- #
import os, ctypes, struct, lib.waveProcessor, wave, lib.rawsp

# --- rendering drumset to the single file --- #
class drumProcessor:

    raswp = None
    
    # --- constructor --- #
    def __init__(self, program_folder=''):
        self.program_folder = program_folder

    def render(self, drumset, samples_folder, samples_ext, tempo, repeat_times, filename, play=0):
        if play==1:
            self.rawsp = lib.rawsp.RawSoundProcessorBase('', self.program_folder)
        print('start rendering drums')
        # defining variables
        samples = {} # samples bytes
        sizes = {} # sizes of the samples
        max_size = 0 # max size of the samples
        # calculating the length of one bit
        bit_length = int(44100*60.0/(tempo*4))*4
        # reading samples and sizes
        for key in drumset:
            f = open(samples_folder+'/'+key.lower()+'.'+samples_ext, 'rb')
            samples[key] = f.read()
            sizes[key] = len(samples[key])
            if sizes[key]>max_size:
                max_size = sizes[key]
            f.close()
        # the length of the drumset
        drumkit_length = len(drumset[key])
        # buffer for storing resulting wav file data
        out = ctypes.create_string_buffer(bit_length*(drumkit_length-1)+max_size)
        # for every bit
        for i in range(drumkit_length):
            for key in drumset:
                if drumset[key][i]==1:
                    j = 0
                    # the cycle by the length of the file
                    while j<sizes[key]:
                        spam = 0
                        # we need feedback cause there might be previous samples
                        spam += struct.unpack('h', out[i*bit_length+j:i*bit_length+j+2])[0]
                        # if current drum is checked - including it to mix
                        if sizes[key]>j:
                            spam += struct.unpack('h', samples[key][j:j+2])[0]
                        spam = lib.waveProcessor.waveProcessor.normalizeWav(spam, 256**2)
                        struct.pack_into('h', out, i*bit_length+j, spam)
                        j=j+2
            if play==1:
                self.rawsp.playBytes(out[i*bit_length:(i+1)*bit_length])
        # if repeat needed
        if repeat_times>1:
            # cross-bytes - when the previous instrument still sounds but the new one begins to sound too. It's just the end of sample mixed with the beginning
            cross = ctypes.create_string_buffer(max_size-bit_length)
            i = 0
            # calculating cross-bytes
            while i < max_size-bit_length:
                # the beginning
                spam = struct.unpack('h', out[i:i+2])[0]
                # mixed with the end
                spam += struct.unpack('h', out[bit_length*drumkit_length+i:bit_length*drumkit_length+i+2])[0]
                # normalizing
                spam = lib.waveProcessor.waveProcessor.normalizeWav(spam, 256**2)
                # and saving
                struct.pack_into('h', cross, i, spam)
                i=i+2
            wav = wave.open(filename, 'wb')
            wav.setnchannels(2)
            wav.setsampwidth(2)
            wav.setframerate(44100)
            # first time we write just our sample. The length is exactly the length of the drumkit
            wav.writeframes(out[0:bit_length*drumkit_length])
            # all other steps we need to write:
            # 1. the cross bytes - the end of the sample mixed with the beginning
            # 2. the remaining bytes
            for i in range(1, repeat_times):
                wav.writeframes(cross)
                wav.writeframes(out[max_size-bit_length:bit_length*drumkit_length])
            # writing the end
            wav.writeframes(out[bit_length*drumkit_length:])
            wav.close()
        else:
            # creating resulting wav file
            lib.waveProcessor.waveProcessor.createWavFromBuffer(filename, out, 2,2,44100)
        print('end rendering drums')
