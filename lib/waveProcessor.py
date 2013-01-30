# --- waveProcessor module --- #
# --- Alexander Safonov <me@asafonov.org> --- #
# --- providing function for processing wav files --- #
import wave, sys, struct, ctypes, shutil, lib.rawsp
# --- providing support of static methods for python 2 --- #
if sys.version_info[0]==2:
    class Callable:
        def __init__(self, anycallable):
            self.__call__ = anycallable

class waveProcessor:

    # --- constructor --- #
    def __init__(self, program_folder=''):
        self.rawsp = lib.rawsp.RawSoundProcessorBase(program_folder)

    # --- creating wav file from buffer --- #
    def createWavFromBuffer(filename, buf, nchannels, sampwidth, framerate):
        wav = wave.open(filename, 'wb')
        wav.setnchannels(nchannels)
        wav.setsampwidth(sampwidth)
        wav.setframerate(framerate)
        wav.writeframes(buf)
        wav.close()
    if sys.version_info[0]==2:
        createWavFromBuffer = Callable(createWavFromBuffer)

    # --- converting RAW file to WAV. Just adding wav headers --- #
    def convertRawToWav(raw_filename, wav_filename, channels, sampwidth, framerate):
        spam = wave.open(wav_filename, 'wb')
        spam.setnchannels(channels)
        spam.setsampwidth(sampwidth)
        spam.setframerate(framerate)
        raw = open(raw_filename, 'rb')
        spam.writeframes(raw.read())
        spam.close()
        raw.close()
    if sys.version_info[0]==2:
        convertRawToWav = Callable(convertRawToWav)

    # --- returning wav headers --- #
    def getWavHeaders(wav_filename):
        wav = wave.open(wav_filename, 'rb')
        (nchannels, sampwidth, framerate, nframes, comptype, compname) = wav.getparams()
        wav.close()
        return (nchannels, sampwidth, framerate, nframes, comptype, compname)
    if sys.version_info[0]==2:
        getWavHeaders = Callable(getWavHeaders)

    # --- convertin WAV file to RAW. Just removing wav headers --- #
    def convertWavToRaw(wav_filename, raw_filename):
        wav = wave.open(wav_filename, 'rb')
        (nchannels, sampwidth, framerate, nframes, comptype, compname) = wav.getparams()
        f = open(raw_filename, 'wb')
        f.write(wav.readframes(nframes))
        f.close()
        wav.close()
    if sys.version_info[0]==2:
        convertWavToRaw = Callable(convertWavToRaw)

    # --- normalizing volume of the wav file sample --- #
    def normalizeWav(sample, peak):
        # |sample| <= peak
        if sample>0:
            return min(int(peak/2-1), sample)
        else:
            return max(int(-peak/2+1), sample)
    if sys.version_info[0]==2:
        normalizeWav = Callable(normalizeWav)

    # --- returns the SHORT numbers of the wave file data --- #
    def getWavePeaks(wav_filename, step=100):
        wav = wave.open(wav_filename, 'rb')
        (nchannels, sampwidth, framerate, nframes, comptype, compname) = wav.getparams()
        out = []
        for i in range(nchannels):
            out.append([])
        peak = 256**sampwidth
        spam = wav.readframes(step)
        while len(spam)>0:
            for i in range(nchannels):
                tmp = struct.unpack('h', spam[i*sampwidth:i*sampwidth+sampwidth])[0]
                out[i].append(tmp)
            spam = wav.readframes(step)
        wav.close()
        return out, peak, nchannels, sampwidth, framerate, nframes
    if sys.version_info[0]==2:
        getWavePeaks = Callable(getWavePeaks)

    # --- repeats the fragment of the wav file --- #
    # in_filename - input file
    # out_filename - output file
    # how_many_times - how many times to repeat the fragment
    # start - start position (in frames) of the fragment
    # end - end position (in frames) of the fragment
    def repeatWav(in_filename, out_filename, how_many_times=1, start=0, end=0):
        # opening wav file and getting its headers
        wav = wave.open(in_filename, 'rb')
        (nchannels, sampwidth, framerate, nframes, comptype, compname) = wav.getparams()
        # if end position = 0 we will repeat the fragment from start position to the end of the file
        if end==0:
            end = nframes
        spam1 = None
        spam2 = None
        # if start position is not the beginning of the file - saving the (beginning, start) fragment
        if start>0:
            spam1 = wav.readframes(start)
        # saving (start, end) fragments
        spam = wav.readframes(end-start)
        # if end position is not the end of the file saving the (end, end of the file)
        if end<nframes:
            spam2 = wav.readframes(nframes-end)
        wav.close()
        # saving output file
        owav = wave.open(out_filename, 'wb')
        owav.setnchannels(nchannels)
        owav.setsampwidth(sampwidth)
        owav.setframerate(framerate)
        # saving (beginning, start) fragment if there is one
        if spam1!=None:
            owav.writeframes(spam1)
        # saving (start, end) fragment how_many_times times
        for i in range(how_many_times+1):
            owav.writeframes(spam)
        #saving (end, end of the file) fragment if there is one
        if spam2!=None:
            owav.writeframes(spam2)
        owav.close()
    if sys.version_info[0]==2:
        repeatWav = Callable(repeatWav)

    # --- adding silence to the wav file --- #
    # in_filename - input file
    # out_filename - output file
    # length = length (in frames) of the silent fragment
    # start - start position (in frames)
    def addSilence(in_filename, out_filename, length, start=0):
        # opening wav file and getting its headers
        wav = wave.open(in_filename, 'rb')
        (nchannels, sampwidth, framerate, nframes, comptype, compname) = wav.getparams()
        spam1 = None
        spam2 = None
        # if start is not the beginnig of the file saving (beginning, start) fragment
        if start>0:
            spam1 = wav.readframes(start)
        # saving (start, end of the file fragment)
        if start<nframes:
            spam2 = wav.readframes(nframes-start)
        # buffer for saving the silence
        out = ctypes.create_string_buffer(length*4)
        # saving the silent signal (0) in binary form
        # is it 0 by default? It looks like I'm loosing time here
        # TODO check is it really needed
        for i in range(length):
            struct.pack_into('h', out, i, 0)
        # saving the output file
        owav = wave.open(out_filename, 'wb')
        owav.setnchannels(nchannels)
        owav.setsampwidth(sampwidth)
        owav.setframerate(framerate)
        # saving the (beginning, start) fragment if there is one
        if spam1!=None:
            owav.writeframes(spam1)
        #saving silence
        owav.writeframes(out)
        if spam2!=None:
            owav.writeframes(spam2)
        owav.close()
    if sys.version_info[0]==2:
        addSilence = Callable(addSilence)

    # --- cutting the fragment from the wav file --- #
    # in_filename - input file
    # out_filename - output file
    # start - start position (in frames)
    # end - end position (in frames)
    def cutWavFragment(in_filename, out_filename, start, end):
        #opening wav file and getting its headers
        wav = wave.open(in_filename, 'rb')
        (nchannels, sampwidth, framerate, nframes, comptype, compname) = wav.getparams()
        spam1 = None
        spam2 = None
        # if start is not the beginnig of the file saving (beginning, start) fragment
        if start>0:
            spam1 = wav.readframes(start)
        # if end is not the end of the file saving the (end, end of the file) fragment
        if end<nframes:
            wav.setpos(end)
            spam2 = wav.readframes(nframes - end)
        wav.close()
        # saving output file
        owav = wave.open(out_filename, 'wb')
        owav.setnchannels(nchannels)
        owav.setsampwidth(sampwidth)
        owav.setframerate(framerate)
        if spam1!=None:
            owav.writeframes(spam1)
        if spam2!=None:
            owav.writeframes(spam2)
        owav.close()
    if sys.version_info[0]==2:
        cutWavFragment = Callable(cutWavFragment)

    # --- applying delay effect to the wav file --- #
    # in_filename - input file
    # out_filename - output file
    # delay_ms - delay time in milliseconds
    # delay_fadeout - delay fadeout factor (delay signal = delay_factor*input_signal)
    def delay(self, in_filename, out_filename, delay_ms=350, delay_fadeout=0.3):
        # opening wav file and getting its headers
        wav = wave.open(in_filename, 'rb')
        (nchannels, sampwidth, framerate, nframes, comptype, compname) = wav.getparams()
        # getting input signal
        spam = wav.readframes(nframes)
        i=0
        l = len(spam)
        # buffer for saving result
        out = ctypes.create_string_buffer(nframes*4)
        # calculating delay in frames of the wav file. It's framerate*delay_in_second in fact. Also we make it %2
        delay_factor = int(framerate*delay_ms/2000)*2
        while i<l:
            # If there is no delay in this position (it's just the beginnig of file) we copy the inut signal
            if i<delay_factor:
                tmp = struct.unpack('h', spam[i:i+2])[0]
            # else applying delay effect. 
            # out_signal = input_signal*(1-delay_fadeout)+delayed_signal*delay_fadeout
            else: 
                tmp = int(struct.unpack('h', spam[i:i+2])[0]*(1-delay_fadeout)+struct.unpack('h', spam[i-delay_factor:i+2-delay_factor])[0]*delay_fadeout)
            struct.pack_into('h', out, i, tmp)
            i = i+2
        # saving output file
        wav.close()
        owav = wave.open(out_filename, 'wb')
        owav.setnchannels(nchannels)
        owav.setsampwidth(sampwidth)
        owav.setframerate(framerate)
        owav.writeframes(out)
        owav.close()

    # mixing list of wav files in memory
    def mixWavListToBytes(self, filenames, play=0):
        # initializing lists for saving wavs headers and data
        wav = []
        nchannels = []
        sampwidth = []
        framerate = []
        nframes = []
        spam = []
        # reading wavs headers and data
        for i in range(len(filenames)):
            wav.append(wave.open(filenames[i]))
            nchannels.append(wav[i].getnchannels())
            sampwidth.append(wav[i].getsampwidth())
            framerate.append(wav[i].getframerate())
            nframes.append(wav[i].getnframes())
            spam.append(wav[i].readframes(nframes[i]))
        # calculating peak of the wav file sample from the first file (peaks for files considered the same)
        peak = 256**sampwidth[0]
        i=0
        # buffer for saving output data
        out = ctypes.create_string_buffer(max(nframes)*4)
        # cycle by the maximum of the file frames
        while i<max(nframes)*4:
            tmp = 0
            # considering all files
            for j in range(len(filenames)):
                # if file j is not over yet it exists in the output signal
                if nframes[j]*4>i:  
                    tmp += struct.unpack('h', spam[j][i:i+2])[0]
            # normalizing the volume of the output signal
            tmp = waveProcessor.normalizeWav(tmp, peak)
            struct.pack_into('h', out, i, tmp)
            i=i+2
            if i>0 and i%1000==0 and play==1:
                self.rawsp.playBytes(out[i-1000:i])
        for i in range(len(filenames)):
            wav[i].close()
        return out, nchannels[0], sampwidth[0], framerate[0]

    # --- mixing the list of wav files --- #
    # filenames - the list of the input files
    # out_filename - output file
    def mixWavList(self, filenames, out_filename):
        if len(filenames)==1:
            shutil.copy(filenames[0], out_filename)
            return 0
        out, nchannels, sampwidth, framerate = self.mixWavListToBytes(filenames)
        # saving output file
        owav = wave.open(out_filename, 'wb')
        owav.setnchannels(nchannels)
        owav.setsampwidth(sampwidth)
        owav.setframerate(framerate)
        owav.writeframes(out)
        owav.close()

    # --- changing the volume of the wav file --- #
    # in_filename - input file
    # out_filename - output file
    # vol_factor - volume increasing/decreasing factor (output = input*vol_factor)
    def changeWavVolume(self, in_filename, out_filename, vol_factor):
        # opening wav file and reading its header
        wav = wave.open(in_filename)
        (nchannels, sampwidth, framerate, nframes, comptype, compname) = wav.getparams()
        # reading wav file data
        spam = wav.readframes(nframes)
        # calculating peak of the wav file sample
        peak = 256**sampwidth
        i=0
        # buffer for saving the result
        out = ctypes.create_string_buffer(nframes*4)
        while i<len(spam):
            # changing volume
            tmp = int(struct.unpack('h', spam[i:i+2])[0]*vol_factor)
            # normalizing wav file
            tmp = waveProcessor.normalizeWav(tmp, peak)
            struct.pack_into('h', out, i, tmp)
            i=i+2
        wav.close()
        # saving the result
        owav = wave.open(out_filename, 'wb')
        owav.setnchannels(nchannels)
        owav.setsampwidth(sampwidth)
        owav.setframerate(framerate)
        owav.writeframes(out)
        owav.close()
