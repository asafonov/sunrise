#!/usr/bin/env python
# --- Sunrise main file --- #
# --- Alexander Safonov <me@asafonov.org> --- #
# --- Main application window --- #
import sys, os, shutil, threading, zipfile
from PyQt4 import QtCore, QtGui
from datetime import datetime
from metronom import Metronome
from lib.rawsp import RawSoundProcessorBase
import lib.waveProcessor, lib.drumProcessor, lib.sampler
from lib.audioscene import AudioScene, AudioRecorderScene

# --- Main window of the application class --- #
class SunriseMainWin(QtGui.QMainWindow):

    program_folder = '' # the folder where Sunrise is installed
    project_scenes = [] # AudioScenes of the project's wav files
    project_wav_filename = 'tmp/project.wav' # wav file for rendering project
    main_toolbar = None # main toolbar of the project. It's empty cause there are no files in empty project -> nothing to play
    current_scene = -1 # indicator of the current wav file of the project in the editor. Needed to know if we're editing new file or existing file of the project
    rawsp = None # instance of the RAW sound processor
    project_filename = '' # filename of the current project
    wav_filename = '' # current wav filename of the AudioRecorderScene
    drums = {} # QToolButtons that actuate as Drum step
    drumstates = {} # current state of the drum sequencer
    drumkit_changed = 0 # indicator if drumkit was changed from the last render
    samples = {} #
    samplestates = {} #
    drum_samples_folder='samples/drums' # sample folder
    drum_samples_ext='raw' # sample extention
    drums_wav_filename = 'tmp/drums.wav' # rendered wav file with drums track
    drumProcessor = None # drum processor object
    waveProcessor = None # wave processor object
    sampler = None # sampler object
    project_file_ready = 0 # indicator that project file is rendered

    # --- constructor --- #
    def __init__(self, filename=''):
        QtGui.QMainWindow.__init__(self, None)
        self.setProgramFolder(filename)
        #self.setStyleSheet("background-color: #333333; color: #00ff66;");

        # --- Main window settings --- #
        self.main = QtGui.QWidget(self)
        self.resize(960, 600)
        self.setWindowTitle('Sunrise DAW')
        self.setCentralWidget(self.main)
        self.setWindowIcon(QtGui.QIcon(self.program_folder+'img/icon.png'))
        vbox = QtGui.QVBoxLayout(self.main)
        # --- END: Main window settings --- #

        # --- Main menu --- #
        open_project_menu = QtGui.QAction('Open', self)
        open_project_menu.triggered.connect(self.openProjectDialog)
        save_project_menu = QtGui.QAction('Save', self)
        save_project_menu.triggered.connect(self.saveProjectDialog)
        save_as_project_menu = QtGui.QAction('Save As', self)
        save_as_project_menu.triggered.connect(self.saveProjectAsDialog)
        open_project_menu.setShortcut('Ctrl+O')
        save_project_menu.setShortcut('Ctrl+S')
        save_as_project_menu.setShortcut('Ctrl+A')
        exit_project_menu = QtGui.QAction('Exit', self)
        exit_project_menu.setShortcut('Ctrl+Q')

        audio_open_menu = QtGui.QAction("Open", self)
        audio_save_menu = QtGui.QAction("Save", self)
        audio_open_menu.setShortcut('Ctrl+Shift+O')
        audio_save_menu.setShortcut('Ctrl+Shift+S')

        drums_save_menu = QtGui.QAction('Save', self)
        drums_save_menu.triggered.connect(self.saveDrums)
        drums_clear_menu = QtGui.QAction('Clear', self)
        drums_clear_menu.triggered.connect(self.clearDrums)

        metronome_tools_menu = QtGui.QAction('Metronome', self)
        metronome_tools_menu.triggered.connect(self.showMetronome)

        volume_effects_menu = QtGui.QAction('Volume', self)
        delay_effects_menu = QtGui.QAction('Delay', self)
        repeat_effects_menu = QtGui.QAction('Repeat', self)
        cut_effects_menu = QtGui.QAction('Cut selection', self)
        
        menu_bar = self.menuBar()
        project = menu_bar.addMenu('&Project')
        audio = menu_bar.addMenu("&Audio")
        drums = menu_bar.addMenu('&Drums')
        tools = menu_bar.addMenu('&Tools')
        help = menu_bar.addMenu("&Help")

        project.addAction(open_project_menu)
        project.addAction(save_project_menu)
        project.addAction(save_as_project_menu)
        project.addAction(exit_project_menu)
        effects = audio.addMenu('Effects')
        audio.addAction(audio_open_menu)
        audio.addAction(audio_save_menu)
        drums.addAction(drums_save_menu)
        drums.addAction(drums_clear_menu)
        tools.addAction(metronome_tools_menu)
        effects.addAction(volume_effects_menu)
        effects.addAction(delay_effects_menu)
        effects.addAction(repeat_effects_menu)
        effects.addAction(cut_effects_menu)

        self.connect(exit_project_menu, QtCore.SIGNAL('triggered()'), QtCore.SLOT('close()'))
        audio_save_menu.triggered.connect(self.saveProjectFile)
        audio_open_menu.triggered.connect(self.openAudioFile)
        repeat_effects_menu.triggered.connect(self.repeatSelection)
        cut_effects_menu.triggered.connect(self.cutSelection)
        # --- END: Main menu --- #

        # --- Tabbed interface --- #
        self.tabs = QtGui.QTabWidget(self)
        tab_main = QtGui.QWidget()
        tab_audio = QtGui.QWidget()
        tab_drums = QtGui.QWidget()
        tab_sampler = QtGui.QWidget()
        self.project_layout = QtGui.QVBoxLayout(tab_main)
        self.audio_layout = QtGui.QVBoxLayout(tab_audio)
        self.drums_layout = QtGui.QVBoxLayout(tab_drums)
        self.sampler_layout = QtGui.QVBoxLayout(tab_sampler)
        self.tabs.addTab(tab_main, 'Project')
        self.tabs.addTab(tab_audio, 'Audio')
        self.tabs.addTab(tab_drums, 'Drums')
        self.tabs.addTab(tab_sampler, 'Sampler')
        # --- END: Tabbed interface --- #

        # initializing RAW sound processor, drum processor and wave processor
        self.rawsp = RawSoundProcessorBase('', self.program_folder)
        self.drumProcessor = lib.drumProcessor.drumProcessor(self.program_folder)
        self.waveProcessor = lib.waveProcessor.waveProcessor(self.program_folder)
        self.sampler = lib.sampler.sampler('rocky_guitar')
        # adding tabbed interface to layout
        vbox.addWidget(self.tabs)
        # drawing audio processing tab and drum tab
        self.drawAudioPage()
        self.drawDrumPage()
        self.drawSamplerPage()

    # --- creating Audio tab --- #
    def drawAudioPage(self):
        # --- Main toolbar --- #
        # play, stop, record controls
        bg = QtGui.QToolBar()
        self.play_b = QtGui.QAction(QtGui.QIcon(self.program_folder+'img/play.png'), 'Play', self)
        self.play_b.triggered.connect(self.startPlaying)
        self.stop_b = QtGui.QAction(QtGui.QIcon(self.program_folder+'img/stop.png'), 'Stop', self)
        self.stop_b.triggered.connect(self.stopPlayRecord)
        self.rec_b = QtGui.QAction(QtGui.QIcon(self.program_folder+'img/rec.png'), 'Record', self)
        self.rec_b.triggered.connect(self.startRecord)
        bg.addAction(self.play_b)
        bg.addAction(self.stop_b)
        bg.addAction(self.rec_b)
        # --- END: Main toolbar --- #

        # --- AudioScene --- #
        # scene and view for drawing and graphical editing recorded sound
        self.qs_left = AudioRecorderScene(0,0,0,0)
        qv_left = QtGui.QGraphicsView(self.qs_left)
        # --- END: AudioScene --- #
        
        # --- Effects --- #
        # inputs and buttons for setting up effects

        # widget for placing effects items
        effect_widget = QtGui.QWidget()
        effect_box = QtGui.QHBoxLayout(effect_widget)

        # volume
        self.vol = QtGui.QSpinBox()
        self.vol.setRange(10, 300)
        self.vol.setValue(100)
        vol_label = QtGui.QLabel('Volume (%): ')
        vol_label.setAlignment(QtCore.Qt.AlignCenter | QtCore.Qt.AlignRight)
        
        # delay
        self.delay_ms = QtGui.QSpinBox()
        self.delay_ms.setRange(0, 2000)
        self.delay_ms.setValue(0)
        self.delay_factor = QtGui.QSpinBox()
        self.delay_factor.setRange(1, 99)
        self.delay_factor.setValue(30)
        delay_ms_label = QtGui.QLabel('Delay (ms): ')
        delay_ms_label.setAlignment(QtCore.Qt.AlignCenter | QtCore.Qt.AlignRight)
        delay_factor_label = QtGui.QLabel('Delay factor (%): ')
        delay_factor_label.setAlignment(QtCore.Qt.AlignCenter | QtCore.Qt.AlignRight)

        # buttons
        effect_apply_button = QtGui.QPushButton('Apply')
        effect_apply_button.clicked.connect(self.applyEffects)
        effect_rollback_button = QtGui.QPushButton('Rollback')
        effect_rollback_button.clicked.connect(self.rollbackEffects)

        # placing widgets
        effect_box.addWidget(vol_label)
        effect_box.addWidget(self.vol)
        effect_box.addWidget(delay_ms_label)
        effect_box.addWidget(self.delay_ms)
        effect_box.addWidget(delay_factor_label)
        effect_box.addWidget(self.delay_factor)
        effect_box.addWidget(effect_apply_button)
        effect_box.addWidget(effect_rollback_button)
        # --- END: Effects --- #
        
        # Placing widgets of the Audio tab
        self.audio_layout.addWidget(bg)
        self.audio_layout.addWidget(qv_left)
        self.audio_layout.addWidget(effect_widget)

        self.audioButtonsStopped()

    # --- creating Sampler tab --- #
    def drawSamplerPage(self):
        # toolbar
        toolbar = QtGui.QToolBar()
        play_b = QtGui.QAction(QtGui.QIcon(self.program_folder+'img/play.png'), 'Play', self)
        play_b.triggered.connect(self.playSampler)
        stop_b = QtGui.QAction(QtGui.QIcon(self.program_folder+'img/stop.png'), 'Stop', self)
        stop_b.triggered.connect(self.stopSampler)
        toolbar.addAction(play_b)
        toolbar.addAction(stop_b)
        self.sampler_layout.addWidget(toolbar)

        sampler = QtGui.QWidget()
        notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'H']
        for key in self.sampler.notes:
            self.samples[key] = []

        grid_box = QtGui.QGridLayout(sampler)
        j=0
        for k in range(len(notes)):
            title = notes[k]
            self.samplestates[title] = []
            lab = QtGui.QLabel(title)
            grid_box.addWidget(lab, j, 0)
            for i in range(16):
                im = QtGui.QToolButton()
                ic = QtGui.QIcon(self.program_folder+'img/red_b.png')
                im.setIcon(ic)
                im.setIconSize(QtCore.QSize(32,32))
                im.clicked.connect(lambda x, t=title, n=i: self.samplerButtonClicked(t, n))
                grid_box.addWidget(im, j, i+1)
                self.samples[title].append(im)
                self.samplestates[title].append(0)
            j=j+1
        self.sampler_layout.addWidget(sampler)

    # --- creating Drums tab --- #
    def drawDrumPage(self):
        # toolbar
        drums_toolbar = QtGui.QToolBar()
        play_b = QtGui.QAction(QtGui.QIcon(self.program_folder+'img/play.png'), 'Play', self)
        play_b.triggered.connect(self.playDrums)
        stop_b = QtGui.QAction(QtGui.QIcon(self.program_folder+'img/stop.png'), 'Stop', self)
        stop_b.triggered.connect(self.stopDrums)
        drums_toolbar.addAction(play_b)
        drums_toolbar.addAction(stop_b)
        self.drums_layout.addWidget(drums_toolbar)

        drums = QtGui.QWidget()
        # fill the types of the Drums
        self.drums['Kick'] = []
        self.drums['Snare'] = []
        self.drums['Hi-Hat'] = []
        self.drums['Crash'] = []
        self.drums['Tom1'] = []
        self.drums['Tom2'] = []
        self.drums['Tom3'] = []

        grid_box = QtGui.QGridLayout(drums)
        j = 0
        # for each drum type adding 16 tacts
        for title in self.drums:
            self.drumstates[title] = []
            lab = QtGui.QLabel(title)
            grid_box.addWidget(lab, j, 0)
            for i in range(16):
                im = QtGui.QToolButton()
                ic = QtGui.QIcon(self.program_folder+'img/red_b.png')
                im.setIcon(ic)
                im.setIconSize(QtCore.QSize(32,32))
                im.clicked.connect(lambda x, t=title, n=i: self.drumButtonClicked(t,n))
                grid_box.addWidget(im, j, i+1)
                self.drums[title].append(im)
                self.drumstates[title].append(0)
            j=j+1
        self.drums_layout.addWidget(drums)

        # render
        render = QtGui.QWidget()
        render_layout = QtGui.QHBoxLayout(render)
        label = QtGui.QLabel('Tempo: ')
        label.setAlignment(QtCore.Qt.AlignCenter | QtCore.Qt.AlignRight)
        render_layout.addWidget(label)
        self.drumtempo = QtGui.QSpinBox()
        self.drumtempo.setRange(10, 122)
        self.drumtempo.setValue(100)
        render_layout.addWidget(self.drumtempo)
        label_repeat = QtGui.QLabel('Repeat (times):')
        label_repeat.setAlignment(QtCore.Qt.AlignCenter | QtCore.Qt.AlignRight)
        render_layout.addWidget(label_repeat)
        self.drumrepeat = QtGui.QSpinBox()
        self.drumrepeat.setRange(1, 100)
        self.drumrepeat.setValue(1)
        render_layout.addWidget(self.drumrepeat)
        button = QtGui.QPushButton('Render')
        button.clicked.connect(self.renderDrums)
        render_layout.addWidget(button)
        self.drums_layout.addWidget(render)

    # --- main toolbar of the project --- #
    def addMainToolbar(self):
        # creating toolbar only it's not created already
        if self.main_toolbar==None:
            self.main_toolbar = QtGui.QToolBar()
            play_b = QtGui.QAction(QtGui.QIcon(self.program_folder+'img/play.png'), 'Play', self)
            play_b.triggered.connect(self.playProject)
            stop_b = QtGui.QAction(QtGui.QIcon(self.program_folder+'img/stop.png'), 'Stop', self)
            stop_b.triggered.connect(self.stopPlayProject)
            self.main_toolbar.addAction(play_b)
            self.main_toolbar.addAction(stop_b)
            self.project_layout.addWidget(self.main_toolbar)
    
    # --- clearing project layout --- #
    def clearProjectLayout(self):
        for i in range(1, self.project_layout.count()):
            spam = self.project_layout.itemAt(i)
            spam.widget().hide()
            spam.widget().destroy()
        self.project_scenes = []

    # --- BLOCK: AudioButtons events --- #

    # --- buttons state while stopped --- #
    def audioButtonsStopped(self):
        self.stop_b.setVisible(0)
        self.rec_b.setVisible(1)
        self.play_b.setVisible(self.wav_filename!='')

    # --- buttons state while recording --- #
    def audioButtonsRecording(self):
        self.rec_b.setVisible(0)
        self.play_b.setVisible(0)
        self.stop_b.setVisible(1)

    # --- buttons state while playing --- #
    def audioButtonsPlaying(self):
        self.audioButtonsRecording()

    # --- BLOCK: AudioButtons events --- #

    # --- BLOCK: Playing/recording processing --- #
    # TODO graphical indicator of the current state (playing/recording/stopped)
    # printing wav file of the Audio tab. Called after recording or editing file of the project
    def printWaveFile(self, filename=''):
        if filename=='':
            filename = self.wav_filename
        self.qs_left.drawWaveFile(filename, self.width()-44, 400)
        self.audioButtonsStopped()

    # --- starting recording --- #
    def startRecord(self):
        self.audioButtonsRecording()
        self.rawsp.startRecording()

    # --- starting playing --- #
    def startPlaying(self):
        self.audioButtonsPlaying()
        self.rawsp.startPlaying()

    # --- stopping playing/recording --- #
    def stopPlayRecord(self):
        print('stop')
        out = self.rawsp.stopPlayRecord()
        if len(out)>0:
            self.printWaveFile(out)
            self.wav_filename = out
        self.audioButtonsStopped()
    # --- END BLOCK: Playing/recording processing --- #

    # --- BLOCK: Effect processing --- #
    # TODO graphical indicator of the state of the effect processing
    # --- rollback effects --- #
    def rollbackEffects(self):
        # only if backup file was saved
       if os.path.exists(self.wav_filename+'.backup'):
            # restoring backup file
            shutil.copy(self.wav_filename+'.backup', self.wav_filename)
            os.remove(self.wav_filename+'.backup')
            # redrawing the wave of the wav file
            self.printWaveFile()

    # --- applying effects --- #
    def applyEffects(self):
        print('applying effects')
        # backing up current file
        shutil.copy(self.wav_filename, self.wav_filename+'.backup')
        # volume
        vol = self.vol.value()
        # only if volume changed
        if vol!=100:
            self.waveProcessor.changeWavVolume(self.wav_filename, self.wav_filename, float(vol)/100)
        # delay
        delay_ms = self.delay_ms.value()
        delay_factor = self.delay_factor.value()
        # only if delay changed
        if delay_ms>0:
            self.waveProcessor.delay(self.wav_filename, self.wav_filename, delay_ms, float(delay_factor)/100)
        # if effects were applied - redrawing the file
        if vol!=100 or delay_ms>0:
            self.printWaveFile()
        # setting up inputs to the initial state
        self.vol.setValue(100)
        self.delay_ms.setValue(0)
        self.delay_factor.setValue(30)
        print('finished')
    # --- END BLOCK: Effect processing --- #

    # --- BLOCK: Selection processing --- #
    # --- repeating the selection --- #
    def repeatSelection(self):
        # User dialog for repeating parameters
        how_many_times = QtGui.QInputDialog.getInt(self, 'Repeat selection', 'How many times?', 1, 1, 100)
        # only if OK was pressed
        if how_many_times[1]:
            # backing up file
            shutil.copy(self.wav_filename, self.wav_filename+'.backup')
            # if something was selected - repeating the selection
            if self.qs_left.selection_start- self.qs_left.selection_end != 0:
                minx = min(self.qs_left.selection_start, self.qs_left.selection_end)
                maxx = max(self.qs_left.selection_start, self.qs_left.selection_end)
                lib.waveProcessor.waveProcessor.repeatWav(self.wav_filename, self.wav_filename, how_many_times[0], int(minx*self.qs_left.frames_per_pix), int(maxx*self.qs_left.frames_per_pix))
            # else: repeating the whole file
            else:
                lib.waveProcessor.waveProcessor.repeatWav(self.wav_filename, self.wav_filename, how_many_times[0])
            self.printWaveFile(self.wav_filename)

    # --- cutting the selected fragment. Slot for Effects->Cut selection menu item
    def cutSelection(self):
        self.qs_left.cutWavFragment()
    # --- END BLOCK: Selection processing --- #

    # --- BLOCK: project files processing --- #
    # --- adding recorder file to the project --- #
    # TODO to add names for the project files
    def addFileToProject(self, wav_filename='', refresh_project_needed=1):
        if wav_filename=='':
            wav_filename = self.wav_filename
        # if file added to project we need to check the main toolbar and create it if needed
        self.addMainToolbar()
        # widget for project file item. Contains scene and buttons
        widget = QtGui.QWidget()
        hbox = QtGui.QHBoxLayout(widget)
        # AudioScene for the project file
        scene = AudioScene(0,0,0,0)
        # we need to check the changes of this scene to check if we need to render new project file
        # May be it's not the best way to handle it but lambda functions is ok for now
        scene.changed.connect(lambda: self.projectSceneChanged(scene.file_changed_mouse))
        scene.drawWaveFile(wav_filename, 0, 200)
        # QGraphicView for displaying scene
        view = QtGui.QGraphicsView(scene)
        view.setAlignment(QtCore.Qt.AlignLeft)

        # buttons for editing and deleting project file
        bg = QtGui.QToolBar()
        bg.setOrientation(2)
        edit_button = QtGui.QAction(QtGui.QIcon(self.program_folder+'img/edit.png'), 'Edit', self)
        num = len(self.project_scenes)
        edit_button.triggered.connect(lambda: self.editTrack(num))
        delete_button = QtGui.QAction(QtGui.QIcon(self.program_folder+'img/delete.png'), 'Delete', self)
        delete_button.triggered.connect(lambda: self.deleteTrack(num))
        bg.addAction(edit_button)
        bg.addAction(delete_button)
        # END: buttons for editing and deleting project file

        # adding widgets to layout
        hbox.addWidget(view)
        hbox.addWidget(bg)
        self.project_layout.addWidget(widget)

        # clearing Audio tab information
        self.wav_filename = ''
        self.qs_left.clear()
        self.rawsp.setFilename(self.program_folder+'tmp/'+datetime.now().strftime('%Y%m%d%H%M%S')+'.raw')
        self.current_scene = -1
        # adding created scene to the project scenes
        self.project_scenes.append(scene)

        # switching tab to Project view
        self.tabs.setCurrentIndex(0)
        print('file added to project')
        self.audioButtonsStopped()
        # rendering project wav file
        if refresh_project_needed==1:
            threading.Thread(target=self.mixFileToProject).start()

    # saving project file after editing it on the Audio tab
    def saveProjectFile(self):
        # if there is no file for editing - adding new file to the project
        if self.current_scene==-1:
            self.addFileToProject()
        # else: saving edited file
        else:
            # redrawing the wave of the edited file
            self.project_scenes[self.current_scene].drawWaveFile(self.wav_filename, 0, 200)
            # clearing Audio tab information
            self.wav_filename=''
            self.qs_left.clear()
            self.current_scene = -1
            # switching to the Project view
            self.tabs.setCurrentIndex(0)
            threading.Thread(target=self.mixFileToProject).start()

    # --- opening wav file and drawing it with AudioScene for editing --- #
    def openAudioFile(self):
        # getting filename
        wav_filename = QtGui.QFileDialog.getOpenFileName(None, 'Open audio file', '.', '*.wav')
        # if file selected
        if wav_filename != '':
            # creating temp wav filename
            tmp_filename = self.program_folder+'tmp/'+datetime.now().strftime('%Y%m%d%H%M%S')
            # copying to temp
            shutil.copy(wav_filename, tmp_filename+'.wav')
            # setting up copied temp file as current file for editing
            self.wav_filename = tmp_filename+'.wav'
            self.rawsp.setFilename(tmp_filename+'.raw')
            self.rawsp.setWavFilename(self.wav_filename)
            self.printWaveFile()
            self.tabs.setCurrentIndex(1)

    # --- marking project track for editing and placing it to the Audio tab. Calls from the edit button of the track
    def editTrack(self, i):
        # setting up filenames to the edited file
        self.wav_filename = self.project_scenes[i].getFilename()
        self.rawsp.setFilename(self.wav_filename.replace('.wav', '.raw'))
        self.rawsp.setWavFilename(self.wav_filename)
        # setting up scenen
        self.current_scene = i
        # print edited file on the Audio tab
        self.printWaveFile(self.wav_filename)
        # switching tab to the Audio view
        self.tabs.setCurrentIndex(1)

    # deleting file from the project. Calls from the delete button of the track
    def deleteTrack(self, i):
        print(i)

    # --- END BLOCK: project files processing --- #

    # --- BLOCK: project menu processing --- #

    # --- open project dialog --- #
    def openProjectDialog(self):
        # getting project filename  
        project_filename = QtGui.QFileDialog.getOpenFileName(None, 'Open project', '.', '*.spr')
        # if user selected project file
        if project_filename!='':
            # clearing project layout
            self.clearProjectLayout()
            # saving this project name as current
            self.project_filename = project_filename
            # opening the project
            self.openProject()

    # --- opening project file --- #
    def openProject(self):
        with zipfile.ZipFile(self.project_filename, 'r') as project_file:
            # extracting all files
            project_file.extractall()
            # getting filenames
            filenames = project_file.namelist()
            # adding files to project
            for i in range(len(filenames)):
                self.addFileToProject(filenames[i], 0)
            # refreshing project wav file
            threading.Thread(target=self.mixFileToProject).start()

    # --- save project dialog --- #
    def saveProjectDialog(self):
        if self.project_filename == '':
            self.saveProjectAsDialog()
        else:
            self.saveProject()

    # --- save project as dialog --- #
    def saveProjectAsDialog(self):
        # getting project filename
        project_filename = QtGui.QFileDialog.getSaveFileName(None, 'Save project as ...', '.', '*.spr')
        # if user entered filename
        if project_filename != '':
            self.project_filename = project_filename
            self.saveProject()

    # --- saving project file --- #
    def saveProject(self):
        # are there any tracks for saving?
        if len(self.project_scenes)==0:
            print('Nothing to save')
            return 0
        # just zipping all traks to the single file
        with zipfile.ZipFile(self.project_filename, 'w') as project_file:
            for i in range(len(self.project_scenes)):
                project_file.write(self.project_scenes[i].getFilename())
            project_file.close()
        print('project Saved')

    # --- END BLOCK: project menu processing --- #

    # --- BLOCK: project playback --- #

    def playProject(self):
        if self.project_file_ready == 0:
            spam = []
            for i in range(len(self.project_scenes)):
                spam.append(self.project_scenes[i].getFilename())
            self.waveProcessor.mixWavListToBytes(spam, 1)
        else:
            self.rawsp.startPlaying(self.project_wav_filename)

    def stopPlayProject(self):
        self.rawsp.stopPlayRecord()

    # --- END BLOCK: project playback --- #

    # --- rendering project files --- #
    def mixFileToProject(self):
        self.project_file_ready = 0
        # getting the list of the project filenames
        spam = []
        for i in range(len(self.project_scenes)):
            spam.append(self.project_scenes[i].getFilename())
        # mixing wave files with the waveProcessor module
        self.waveProcessor.mixWavList(spam, self.project_wav_filename)
        self.project_file_ready = 1
        print('project file updated')

    # --- Event: if scene with the project file changed --- #
    def projectSceneChanged(self, refresh_needed):
        if refresh_needed == 1:
            print('updating project file')
            # rendering project files in the separate thread
            threading.Thread(target=self.mixFileToProject).start()

    # --- BLOCK: Tools --- #

    # --- creating Metronome object and showing it --- #
    def showMetronome(self):
        self.metronome = Metronome(self.program_folder)
        self.metronome.show()

    # --- END BLOCK: Tools --- #

    # --- BLOCK: Drums --- #

    # --- slot for drums item clicked. Changing state and playing sound if state became active --- #
    def drumButtonClicked(self, drum_title, drum_index):
        # changing current state
        self.drumkit_changed = 1
        self.drumstates[drum_title][drum_index] = 1-self.drumstates[drum_title][drum_index]
        state = self.drumstates[drum_title][drum_index]
        # changing icon of the current tool button
        if state == 1:
            ic = QtGui.QIcon(self.program_folder+'img/green_b.png')
            # playing selected drum sound
            self.rawsp.setWavFilename(self.drum_samples_folder+'/'+drum_title.lower()+'.'+self.drum_samples_ext)
            self.rawsp.startPlaying()
        else:
            ic = QtGui.QIcon(self.program_folder+'img/red_b.png')
        self.drums[drum_title][drum_index].setIcon(ic)

    # --- playing current rendered file --- #
    def playDrums(self):
        if self.drumkit_changed == 0:
            self.rawsp.startPlaying(self.drums_wav_filename)
        else:
            self.drumProcessor.render(self.drumstates, self.drum_samples_folder, self.drum_samples_ext, self.drumtempo.value(), self.drumrepeat.value(), self.drums_wav_filename, 1)
            self.drumkit_changed = 0

    # --- stopping current file --- #
    def stopDrums(self):
        self.rawsp.stopPlayRecord()

    # --- rendering drums --- #
    def renderDrums(self):
        self.drumProcessor.render(self.drumstates, self.drum_samples_folder, self.drum_samples_ext, self.drumtempo.value(), self.drumrepeat.value(), self.drums_wav_filename)
        self.drumkit_changed = 0

    # --- adding current drum track to the project --- #
    def saveDrums(self):
        new_filename = self.program_folder+'tmp/'+datetime.now().strftime('%Y%m%d%H%M%S')+'d.wav'
        shutil.copy(self.drums_wav_filename, new_filename)
        self.addFileToProject(new_filename)

    # --- clearing current drumkit state --- #
    def clearDrums(self):
        ic = QtGui.QIcon(self.program_folder+'img/red_b.png')
        for key in self.drums:
            for i in range(len(self.drums[key])):
                self.drums[key][i].setIcon(ic)
                self.drumstates[key][i] = 0

    # --- END BLOCK: Drums --- #

    # --- BLOCK Sampler --- #

    def samplerButtonClicked(self, sample_title, sample_index):
        # changing current state
        self.sampler_changed = 1
        self.samplestates[sample_title][sample_index] = 1-self.samplestates[sample_title][sample_index]
        state = self.samplestates[sample_title][sample_index]
        # changing icon of the current tool button
        if state == 1:
            ic = QtGui.QIcon(self.program_folder+'img/green_b.png')
            # playing selected drum sound
            filename = self.sampler.getNoteFilename(sample_title)
            self.rawsp.setWavFilename(filename)
            self.rawsp.startPlaying()
        else:
            ic = QtGui.QIcon(self.program_folder+'img/red_b.png')
        self.samples[sample_title][sample_index].setIcon(ic)

    def playSampler(self):
        pass

    def stopSampler(self):
        pass

    # --- END BLOCK Sampler --- #

    # --- project folder setter --- #
    def setProgramFolder(self, folder):
        self.program_folder = folder
        self.project_wav_filename = folder+self.project_wav_filename
        self.drum_samples_folder = folder+self.drum_samples_folder
        self.drums_wav_filename = folder+self.drums_wav_filename

# --- program entry point --- #
if __name__ == "__main__":
    app = QtGui.QApplication(sys.argv)
    if len(sys.argv)>1:
        m = SunriseMainWin(sys.argv[1])
    else:
        m = SunriseMainWin()
    m.show()
    sys.exit(app.exec_())
