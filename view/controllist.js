class ControlListView {

  constructor (list) {
    this.container = document.querySelector('.controls')
    this.views = []

    for (let i = 0; i < list.length; ++i) {
      this.views.push(new ControlView(list[i], this.container))
    }
  }

  destroy() {
    for (let i = 0; i < this.views.length; ++i) {
      this.views[i].destroy()
      this.views[i] = null
    }

    this.views = null
    this.container = null
  }

}
