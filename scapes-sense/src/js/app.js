import $ from 'jquery'
import _ from 'lodash'
import TweenMax from 'gsap'
import dat from 'dat-gui'

// import three and make it global
// so plugins can hook onto the namespace THREE
import THREE from 'three'
window.THREE = THREE

import 'three/loaders/OBJLoader'

import './util.js'

import { Landscape } from './landscape.js'

// application
class App {
  constructor() {
    this.$canvas = null

    this.clock = null
    this.renderer = null
    this.camera = null
    this.fog = null
    this.scene = null
    this.light1 = null
    this.light2 = null
    this.light3 = null

    this.sceneWidth = window.innerWidth
    this.sceneHeight = window.innerHeight

    this.parameters = {}

    $(document).ready(() => {
      this.init()
      this.resize()
    })
  }

  init() {

    // elements
    this.$overlay = $('.overlay')
    this.$heroTitle = $('.herotitle')
    this.$canvas = $('#canvas')

    // random palette
    let colorPalette = randomFromArray([
      [0x130C19, 0x2A2763, 0xFF5449, 0xFF8748],
      [0x130C19, 0x2a2763, 0x49ffde, 0xff4848],
      [0x130C19, 0x2a2663, 0x49ff9e, 0xff48a8]
    ])

    // parameters
    this.parameters = {
      bgcolor: colorPalette[0],
      fogcolor: colorPalette[0],
      color1: colorPalette[1],
      color2: colorPalette[2],
      color3: colorPalette[3]
    }

    // overlay
    TweenMax.to(this.$overlay, 5.0, {opacity: 0})

    // clock
    this.clock = new THREE.Clock()

    // renderer
    this.renderer = new THREE.WebGLRenderer({ canvas: this.$canvas[0], antialias: true, preserveDrawingBuffer: true })
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setClearColor(this.parameters.bgcolor)
    this.renderer.setSize(this.sceneWidth, this.sceneHeight)

    // camera
    this.camera = new THREE.PerspectiveCamera(70, this.sceneWidth / this.sceneHeight, 1, 2000)
    this.camera.position.z = 250

    // scene & world
    this.fog = new THREE.FogExp2(this.parameters.fogcolor, 0.0015)
    this.scene = new THREE.Scene()
    this.scene.fog = this.fog
    this.createWorld()

    // title
    this.$heroTitle.css('color', '#' + colorPalette[2].toString(16))

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
    this.landscapeBottom.position.y = -200.0
    this.scene.add(this.landscapeBottom)

    this.landscapeTop = new Landscape()
    this.landscapeTop.rotation.z = Math.PI
    this.landscapeTop.position.y = 200.0
    this.scene.add(this.landscapeTop)

    this.light1 = new THREE.PointLight(this.parameters.color1, 30, 500)
    this.light1.position.set(0, 0, -500)
    this.scene.add(this.light1)

    this.light2 = new THREE.PointLight(this.parameters.color2, 30, 250)
    this.light2.position.set(150, -50, -250)
    this.scene.add(this.light2)

    this.light3 = new THREE.PointLight(this.parameters.color3, 25, 350)
    this.light3.position.set(-150, 50, -150)
    this.scene.add(this.light3)
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

    // enable gui, but hide it first
    // user can call it by pressing 'h'
    dat.gui.GUI.toggleHide()
    setTimeout(() => {
      $('.dg.ac').css('opacity', 1)
    }, 250)

    // Colors
    let colorFolder = this.gui.addFolder('Colors')
    colorFolder.open()
    colorFolder.addColor(this.parameters, 'bgcolor').onChange((value) => { this.renderer.setClearColor(value) })
    colorFolder.addColor(this.parameters, 'fogcolor').onChange((value) => { this.fog.color.set(value) })
    colorFolder.addColor(this.parameters, 'color1').onChange((value) => { this.light1.color.set(value) })
    colorFolder.addColor(this.parameters, 'color2').onChange((value) => { this.light2.color.set(value) })
    colorFolder.addColor(this.parameters, 'color3').onChange((value) => {
      this.light3.color.set(value)
      this.$heroTitle.css('color', '#' + value.toString(16))
    })
  }
}

// export already created instance
export let app = new App()
