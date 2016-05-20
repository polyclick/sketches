import $ from 'jquery'
import _ from 'lodash'
import TweenMax from 'gsap'
import dat from 'dat-gui'

// import three and make it global
// so plugins can hook onto the namespace THREE
import THREE from 'three'
window.THREE = THREE

import 'three/loaders/OBJLoader'

import { Landscape } from './landscape.js'

// application
class App {
  constructor() {
    this.$canvas = null

    this.renderer = null
    this.camera = null
    this.fog = null
    this.scene = null

    this.sceneWidth = window.innerWidth
    this.sceneHeight = window.innerHeight

    // parameters
    this.parameters = {
      bgcolor: 0x130C19,
      fogcolor: 0x130C19
    }

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
    this.renderer.setClearColor(this.parameters.bgcolor)
    this.renderer.setSize(this.sceneWidth, this.sceneHeight)

    // camera
    this.camera = new THREE.PerspectiveCamera(70, this.sceneWidth / this.sceneHeight, 1, 2000)
    this.camera.position.z = 50

    // scene & world
    this.fog = new THREE.FogExp2(this.parameters.fogcolor, 0.0015)
    this.scene = new THREE.Scene()
    this.scene.fog = this.fog
    this.createWorld()

    // setup gui
    this.setupGui()

    // render & animation ticker
    TweenMax.ticker.fps(60)
    TweenMax.ticker.addEventListener('tick', () => { this.tick() })

    // resize handler, resize once
    $(window).resize(() => { this.resize() })
  }

  createWorld() {
    this.landscapeBottom = new Landscape()
    this.landscapeBottom.position.y = -300.0
    this.scene.add(this.landscapeBottom)

    this.landscapeTop = new Landscape()
    this.landscapeTop.rotation.z = Math.PI
    this.landscapeTop.position.y = 300.0
    this.scene.add(this.landscapeTop)
  }

  tick() {
    this.update()
    this.draw()
  }

  update() {
    if(this.landscapeBottom) this.landscapeBottom.update()
    if(this.landscapeTop) this.landscapeTop.update()
  }

  draw() {
    this.renderer.render(this.scene, this.camera)
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

  setupGui() {
    this.gui = new dat.GUI()
    dat.gui.GUI.toggleHide()

    // Colors
    let colorFolder = this.gui.addFolder('Colors')
    colorFolder.open()
    colorFolder.addColor(this.parameters, 'bgcolor').onChange((value) => { this.renderer.setClearColor(value) })
    colorFolder.addColor(this.parameters, 'fogcolor').onChange((value) => { this.fog.color.set(value) })
  }
}

// export already created instance
export let app = new App()
