import $ from 'jquery'
import _ from 'lodash'
import TweenMax from 'gsap'
import CCapture from 'ccapture.js'
import dat from 'dat-gui'

// import three and make it global
// so plugins can hook onto the namespace THREE
import THREE from 'three'
window.THREE = THREE

import 'three/loaders/OBJLoader'

import { Landscape } from './landscape.js'
import { Element } from './element.js'

// application
class App {
  constructor() {
    this.$canvas = null

    this.renderer = null
    this.camera = null
    this.scene = null
    this.capturer = null
    this.gui = null

    this.sceneWidth = window.innerWidth
    this.sceneHeight = window.innerHeight

    $(document).ready(() => {
      this.init()
      this.resize()
    })
  }

  init() {

    // canvas
    this.$canvas = $('#canvas')

    // renderer
    this.renderer = new THREE.WebGLRenderer({ canvas: this.$canvas[0], antialias: true, preserveDrawingBuffer: true })
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(this.sceneWidth, this.sceneHeight)

    // camera
    this.camera = new THREE.PerspectiveCamera(70, this.sceneWidth / this.sceneHeight, 1, 1000)
    this.camera.position.z = 0

    // scene & world
    this.scene = new THREE.Scene()
    this.createWorld()

    // capturer
    this.capturer = new CCapture({
      framerate: 60,
      verbose: true,
      format: 'webm'
    })

    // gui
    let guiElements = {
      start:() => { this.capturer.start() },
      stop:() => { this.capturer.stop() },
      save:() => { this.capturer.save() }
    }

    this.gui = new dat.GUI()
    dat.GUI.toggleHide()
    this.gui.add(guiElements, 'start')
    this.gui.add(guiElements, 'stop')
    this.gui.add(guiElements, 'save')

    // render & animation ticker
    TweenMax.lagSmoothing(0)
    TweenMax.ticker.fps(60)
    TweenMax.ticker.useRAF(false)
    TweenMax.ticker.addEventListener('tick', () => { this.tick() })

    // resize handler, resize once
    $(window).resize(() => { this.resize() })
  }

  createWorld() {
    this.landscapeLeft = new Landscape()
    this.landscapeLeft.rotation.z = -Math.PI / 2
    this.landscapeLeft.position.x = -200.0
    this.scene.add(this.landscapeLeft)

    this.landscapeRight = new Landscape()
    this.landscapeRight.rotation.z = Math.PI / 2
    this.landscapeRight.position.x = 200.0
    this.scene.add(this.landscapeRight)

    for(let i = 0 ; i < 15 ; i++) {
      let element = new Element()
      this.scene.add(element)
      this.animateElement(element, i)
    }
  }

  animateElement(element, index) {
    element.position.z = -1250
    TweenMax.to(element.position, 2 + (Math.random() * 3), {
      delay: index ? index / 2 : 0,
      z: -1,
      x: (Math.random() * 200) - 100,
      y: (Math.random() * 200) - 100,
      onComplete: () => {
        this.animateElement(element)
      }
    })
  }

  tick() {
    this.update()
    this.draw()
    this.capture()
  }

  update() {
    if(this.landscapeLeft) this.landscapeLeft.update()
    if(this.landscapeRight) this.landscapeRight.update()
  }

  draw() {
    this.renderer.render(this.scene, this.camera)
  }

  capture() {
    this.capturer.capture(this.$canvas[0])
  }

  resize() {

    // update vars
    this.sceneWidth = window.innerWidth
    this.sceneHeight = window.innerHeight

    // update camera
    this.camera.aspect = this.sceneWidth / this.sceneHeight
    this.camera.updateProjectionMatrix()

    // update renderer
    this.renderer.setSize(this.sceneWidth, this.sceneHeight)
  }
}

// export already created instance
export let app = new App()
