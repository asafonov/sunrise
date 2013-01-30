# --- audioscene module --- #
# --- Alexander Safonov <me@asafonov.org> --- #
# --- provides the classes for drawing and processing wav files --- #
from PyQt4 import QtGui, QtCore
import lib.waveProcessor, shutil

# --- AudioScene class --- #
# --- provides functions for drawing wav file and moving the wave of the file to add silence to the beginning or remove fragment from the beginning --- # 
class AudioScene(QtGui.QGraphicsScene):
    
    is_mouse_pressed = 0 # indicator for mouse button
    mouse_click = 0 # X coordianate of the mouse click
    last_pos = 0 # current mouse position. Only if the button clicked
    item_group = None # the group of elements for moving
    file_changed_mouse = 0 # indicator of changing the wav file during the mouse events

    # --- BLOCK: mouse events --- #
    # --- User will move the whole wave of the wave file with the mouse to correct its position within the project --- #

    def __init__(self,x,y,h,w):
        QtGui.QGraphicsScene.__init__(self,x,y,h,w)
        # setting pen and brush
        self.pen = QtGui.QPen(QtGui.QColor(0,255,100))
        self.setBackgroundBrush(QtGui.QBrush(QtGui.QColor(50,50,50)))

    # --- mouse press event --- #
    def mousePressEvent(self, mouseEvent):
        # only if left button is pressed
        if mouseEvent.button() == QtCore.Qt.LeftButton:
            # saving main indicators:
            self.is_mouse_pressed = 1
            self.file_changed_mouse = 0
            self.mouse_click = mouseEvent.scenePos().x()
            self.last_pos = self.mouse_click
            # select all items to move with the mouse
            self.item_group = self.createItemGroup(self.items())

    # --- mouse move event --- #
    def mouseMoveEvent(self, mouseEvent):
        # only if the left button is pressed
        if self.is_mouse_pressed==1:
            # moving the wave of the wav file with the mouse
            self.moveWave(mouseEvent)

    # --- mouse release event --- #
    def mouseReleaseEvent(self, mouseEvent):
        # only if the left button was pressed
        if self.is_mouse_pressed==1:
            # only if the cursor was actually moved 
            # only if the cursor was moved to the right for now
            # TODO develop moving the wave to the left
            if self.last_pos - self.mouse_click>0:
                # adding silence to the wav file since the wave was moved to the right
                self.addSilence((self.last_pos - self.mouse_click)*self.frames_per_pix)
                # the file was changed
                self.file_changed_mouse = 1

            # rollback indicators, destroing the selection of the items
            self.is_mouse_pressed = 0
            self.last_pos = 0
            self.destroyItemGroup(self.item_group)

    # --- END BLOCK: mouse events --- #

    # --- moving the graphic of the wave file with the mouse --- #
    def moveWave(self, mouseEvent):
        # current mouse position
        mouse_pos = mouseEvent.scenePos().x()
        # only if the cursor was actually moved 
        # only if the cursor was moved to the right for now
        # TODO develop moving the wave to the left
        if mouse_pos - self.mouse_click>0:
            self.item_group.moveBy(mouse_pos-self.last_pos, 0)
        # saving last mouse position
        self.last_pos = mouse_pos

    # --- adding silence to the wav file --- #
    def addSilence(self, length):
        # backing up current file
        shutil.copy(self.filename, self.filename+'.backup')
        # adding silence with the waveProcessor module
        lib.waveProcessor.waveProcessor.addSilence(self.filename+'.backup', self.filename,int(length))
        # redrawing scene
        self.drawWaveFile(self.filename, self.pic_width, self.pic_height, self.step)

    # --- cutting the fragment of the wav file
    def cutWavFragment(self, length):
        # backing up current file
        shutil.copy(self.filename, self.filename+'.backup')
        # cutting the fragment with the waveProcessor module
        lib.waveProcessor.waveProcessor.cutWavFragment(self.filename+'.backup', self.filename, 0, int(length*self.frames_per_pix))
        # redrawing scene
        self.drawWaveFile(self.filename, self.pic_width, self.pic_height, self.step)

    # filename getter
    def getFilename(self):
        return self.filename

    # --- drawing the wave of the wav file --- #
    def drawWaveFile(self, filename, pic_width, pic_height, step=100):
        # clearing scene before drawing
        self.clear()
        # getting wav file parameters
        # data - actual sound data
        # peak - maximum value for the data sample
        # nchannels - number of channels
        # sampwidth - the number of bytes of the data sample
        # framerate - frame frequency
        # nframes - number of frames of the wav file
        data, peak, nchannels, sampwidth, framerate, nframes = lib.waveProcessor.waveProcessor.getWavePeaks(filename, step)
        # calculating the starting point of the drawing
        prevPointY=int(data[0][0]*pic_height/peak)
        prevPointX = 0

        cnt = len(data[0])
        for i in range(1, cnt):
            # if file is long the step of the drawing is fixed
            if cnt/10>pic_width:
                x = int(i/10)
            # else: the drawing will fill the whole picture width
            else: 
                x = int(i*pic_width/cnt)
            # Y coordinate - scaling to the picture height
            y = int(data[0][i]*pic_height/peak)
            # drawing the line from the prev point to current
            self.addLine(prevPointX, prevPointY, x, y, self.pen)
            # saving current point as previous for the next step
            prevPointY = y
            prevPointX = x
        # calculating the number of pixels in the second of time and the number of frames in one pixel
        if cnt/10>pic_width:
            self.pix_per_second = int(framerate/(10*step))
            self.frames_per_pix = 10*step
        else:
            self.pix_per_second = int(framerate*pic_width/(cnt*step))
            self.frames_per_pix = int(cnt*step/pic_width)
        # setting main class properties
        self.filename = filename
        self.selection = None
        self.pic_width = pic_width
        self.pic_height = pic_height
        self.step = step
        self.wav_filelen = float(nframes)/framerate
        self.is_mouse_pressed = 0

# --- AudioRecorderScene class --- #
# --- Inherits: AudioScene --- #
# --- provides functions for drawing wav file, selecting fragments of the file and removing fragments --- # 
class AudioRecorderScene(AudioScene):

    is_mouse_pressed = 0 # indicator for mouse button
    selection_start = 0 # the X coordinate of the start of selected block
    selection_end = 0 # the X coordinate of the end of selected block

    # --- BLOCK: mouse events --- #
    # --- User will select the fragment of the wav file. The selection is highlighted --- #

    # --- mouse press event --- #
    def mousePressEvent(self, mouseEvent):
        # only if the left button was pressed
        if mouseEvent.button() == QtCore.Qt.LeftButton:
            # saving starting point of the selection
            self.selection_start = mouseEvent.scenePos().x()
            self.is_mouse_pressed = 1
            # if something was selected before we remove the current selection Rect
            if self.selection!=None:
                self.removeItem(self.selection)
                self.selection = None

    # --- mouse move event --- #
    def mouseMoveEvent(self, mouseEvent):
        # only if the left button is pressed
        if self.is_mouse_pressed==1:
            # drawing the selection Rect
            self.drawSelection(mouseEvent)

    # --- mouse release event --- #
    def mouseReleaseEvent(self, mouseEvent):
        # only if the left button was pressed
        if self.is_mouse_pressed==1:
            # saving indicator that mouse button was released
            self.is_mouse_pressed = 0
            # we do not need to draw selection cause it was drawn with the mouse move even

    # --- mouse double click event --- #
    def mouseDoubleClickEvent(self, mouseEvent):
        print('double click')

    # --- END BLOCK: mouse events --- #

    # --- key press event --- #
    # --- cutting the fragment of the wav file with the DEL key --- #
    def keyPressEvent(self, keyEvent):
        # --- del key pressed --- #
        if keyEvent.key()==16777223:
            self.cutWavFragment()

    # --- drawing the selection Rect --- #
    def drawSelection(self, mouseEvent):
        # if something was selected before - delete this selection Rect. It should be only one
        if self.selection!=None:
            self.removeItem(self.selection)
        # the height/2 of the selection Rect
        h = 200#int(self.height()/2)
        # saving end of selection coordinate
        self.selection_end = mouseEvent.scenePos().x()
        # correcting end selection coordinates if mouse is outside of the scene object
        if self.selection_end<0:
            self.selection_end = 0
        if self.selection_end>self.width():
            self.selection_end = self.width()
        # calculating the Rect coordinates. We need to calculate min and max to consider left-to-right and right-to-left mouse movements
        minx = min(self.selection_start, self.selection_end)
        maxx = max(self.selection_start, self.selection_end)
        # drawing the Rect of the selection
        self.selection = self.addRect(minx, -h, maxx-minx, 2*h, QtGui.QPen(), QtGui.QBrush(QtGui.QColor(100,100,100, 100)))

    # --- cutting wav file fragment --- #
    def cutWavFragment(self):
        # only if something is selected
        if self.selection_start- self.selection_end != 0:
            # calculating the Rect coordinates. We need to calculate min and max to consider left-to-right and right-to-left mouse movements
            minx = min(self.selection_start, self.selection_end)
            maxx = max(self.selection_start, self.selection_end)
            # backing up file
            shutil.copy(self.filename, self.filename+'.backup')
            # cutting the wav file with the waveProcessor module
            lib.waveProcessor.waveProcessor.cutWavFragment(self.filename+'.backup', self.filename, int(minx*self.frames_per_pix), int(maxx*self.frames_per_pix))
            # redrawing the wav file
            self.drawWaveFile(self.filename, self.pic_width, self.pic_height, self.step)
            # clearing the selection coordinates
            self.clearSelection()

    # --- clearing the selection coordinates --- #
    def clearSelection(self):
        self.selection_start = 0
        self.selection_end = 0

    # --- drawing the seconds markers of the wav file to improve orientation within the wave --- #
    def drawTiming(self, interval = 10):
        w = self.width()
        h = 180#int(self.height()/2)
        i=0
        while i<self.wav_filelen:
            label = QtGui.QGraphicsTextItem(str(i))
            label.setPos(i*self.pix_per_second ,h)
            self.addItem(label)
            label = QtGui.QGraphicsTextItem(str(i))
            label.setPos(i*self.pix_per_second ,-h)
            self.addItem(label)
            i=i+interval

    # --- drawing the wave of the wav file --- #
    def drawWaveFile(self, filename, pic_width, pic_height, step=100):
        # calling the method of the parent
        AudioScene.drawWaveFile(self, filename, pic_width, pic_height, step)
        # drawing the seconds markers
        self.drawTiming()
