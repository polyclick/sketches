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

    // load the texture we need
    PIXI.loader.add('bg', 'images/bg-background.gif').load((loader, resources) => {

      // bg
      let bg = new PIXI.Sprite(resources.bg.texture);
      bg.position.x = 0
      bg.position.y = 0
      this.scene.addChild(bg)

      // pixels
      for(let i = 0; i < 500; i++) {
        let pixel = new PIXI.Graphics()
        pixel.beginFill(0x000000)
        pixel.drawRect(0, 0, 1, 1)
        this.positionPixel(pixel)
        this.pixels.push(pixel)
        this.scene.addChild(pixel)
      }

      // start dropping pixels
      // setTimeout(() => { this.dropPixel() }, 1000)
    })
  }

  tick() {
    this.update()
    this.draw()
  }

  update() {
    // this.graphics.position.x = this.sceneWidth / 2
    // this.graphics.position.y = this.sceneHeight / 2
    // this.graphics.rotation += 0.5

    for(let i = 0; i < this.pixels.length; i++) {
      let pixel = this.pixels[i]
      // pixel.position.x += -1 + (Math.random() * 2)
      // pixel.position.y += -1 + (Math.random() * 2)
    }
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
      if(distance(pixel.position.x, pixel.position.y, this.mouseX, this.mouseY) < 75) {
        this.centerPixel(pixel)
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

    let endPositionX = (this.sceneWidth / 2) + randomBetween(-350, 350)
    let endPositionY = (this.sceneHeight / 2) + randomBetween(-200, 200)

    //TweenMax.to(pixel.scale, 0.15, { x: 50, ease: Sine.easeOut })
    TweenMax.to(pixel.scale, 0.50, { x: 150, y: 150, delay: 0.50, ease: Sine.easeOut })
    TweenMax.to(pixel.position, 1.05, { x: endPositionX, y: endPositionY, ease:Sine.easeInOut, onComplete:() => { this.positionPixel(pixel) } })
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
