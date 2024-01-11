class DrumTrackListView {
  
  constructor (list) {
    this.colors = ['red', 'green', 'yellow', 'green2', 'blue', 'blue2', 'violet']
    this.container = document.querySelector('.drumtrack')

    for (let i = 0; i < list.length; ++i) {
      const view = new DrumTrackView(list[i], this.colors[i % this.colors.length], this.container)
    }
  }

}
