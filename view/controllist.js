class ControlListView {
  
  constructor (list) {
    this.container = document.querySelector('.controls')

    for (let i = 0; i < list.length; ++i) {
      const view = new ControlView(list[i], this.container)
    }
  }

}
