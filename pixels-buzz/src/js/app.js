import $ from 'jquery'
// import _ from 'lodash'
import TweenMax from 'gsap'
import PIXI from 'pixi.js'

import './utils.js'

// application
class App {
  constructor() {
    this.$canvas = null

    this.renderer = null
    this.scene = null
    this.graphics = null

    this.sceneWidth = window.innerWidth
    this.sceneHeight = window.innerHeight

    this.pixels = []

    $(document).ready(() => {
      this.init()
      this.resize()
    })
  }

  init() {

    // canvas
    this.$canvas = $('#canvas')

    // renderer
    this.renderer = new PIXI.WebGLRenderer(this.sceneWidth, this.sceneHeight, {
      view: this.$canvas[0],
      antialias: true,
      resolution: window.devicePixelRatio,
      transparent: true
    })

    // scene & world
    this.scene = new PIXI.Container()
    this.createWorld()

    // render & animation ticker
    TweenMax.ticker.fps(60)
    TweenMax.ticker.addEventListener('tick', () => { this.tick() })

    // resize handler, resize once
    $(window).resize(() => { this.resize() })

    // move move
    $(window).mousemove((event) => { this.mousemove(event) })
  }

  createWorld() {
    for(let i = 0; i < 1000; i++) {
      let pixel = new PIXI.Graphics()
      pixel.beginFill(0x000000)
      pixel.drawRect(0, 0, 2, 2)
      this.positionPixel(pixel)
      this.pixels.push(pixel)
      this.scene.addChild(pixel)
    }
  }

  tick() {
    this.update()
    this.draw()
  }

  update() {

  }

  draw() {
    this.renderer.render(this.scene)
  }

  resize() {

    // update vars
    this.sceneWidth = window.innerWidth
    this.sceneHeight = window.innerHeight

    // update renderer
    this.renderer.resize(this.sceneWidth, this.sceneHeight)
  }

  mousemove(event) {
    this.mouseX = event.clientX
    this.mouseY = event.clientY

    for(let i = 0; i < this.pixels.length; i++) {
      let pixel = this.pixels[i]
      if(distance(pixel.position.x, pixel.position.y, this.mouseX, this.mouseY) < 20) {
        this.animatePixel(pixel)
      }
    }
  }

  dropPixel() {
    let randomPixel = randomFromArray(this.pixels)
    TweenMax.to(randomPixel.position, 1, { x: this.sceneWidth / 2 })
    TweenMax.to(randomPixel.scale, 0.15, { x: 50 })
    TweenMax.to(randomPixel.scale, 0.15, { delay: 0.85, x: 1 })
    setTimeout(() => { this.dropPixel() }, 500 + (Math.random() * 1000))
  }

  centerPixel(pixel) {
    if(Math.random() < 0.7) return

    let endPosition = pixel.position.x < this.sceneWidth / 2 ? 0 : this.sceneWidth

    TweenMax.to(pixel.scale, 0.15, { x: 50, ease: Sine.easeOut })
    TweenMax.to(pixel.scale, 0.15, { x: 1, delay: 0.85, ease: Sine.easeOut })
    TweenMax.to(pixel.position, 1, { x: endPosition, ease:Sine.easeInOut, onComplete:() => { this.positionPixel(pixel) } })
  }

  animatePixel(pixel) {
    let direction = randomFromArray(['top', 'bottom', 'left', 'right'])
    if(direction === 'top')
      TweenMax.to(pixel.position, 1, { y: 0, ease:Sine.easeInOut, onComplete:() => { this.positionPixel(pixel) } })
    if(direction === 'bottom')
      TweenMax.to(pixel.position, 1, { y: this.sceneHeight, ease:Sine.easeInOut, onComplete:() => { this.positionPixel(pixel) } })
    if(direction === 'left')
      TweenMax.to(pixel.position, 1, { x: 0, ease:Sine.easeInOut, onComplete:() => { this.positionPixel(pixel) } })
    if(direction === 'right')
      TweenMax.to(pixel.position, 1, { x: this.sceneWidth, ease:Sine.easeInOut, onComplete:() => { this.positionPixel(pixel) } })
  }

  positionPixel(pixel) {
    pixel.scale.x = 1
    pixel.scale.y = 1
    pixel.position.x = Math.round(Math.random() * this.sceneWidth)
    pixel.position.y = Math.round(Math.random() * this.sceneHeight)
  }
}

// export already created instance
export let app = new App()
