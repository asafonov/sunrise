class DrumTrackListView {
  
  constructor (list) {
    this.colors = ['red', 'green', 'yellow', 'green2', 'blue', 'blue2', 'violet']
    this.container = document.querySelector('.drumtrack')
    this.controller = new DrumTrackListController()

    for (let i = 0; i < list.length; ++i) {
      const view = new DrumTrackView(list[i], this.colors[i % this.colors.length], this.container)
      this.controller.addTrackController(view.getController())
    }
  }

  destroy() {
    this.controller.destroy()
    this.controller = null
    this.container = null
    this.colors = null
  }

}
