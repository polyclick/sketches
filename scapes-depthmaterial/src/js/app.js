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
import { Trail } from './trail.js'

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

    // parameters
    this.parameters = {
      bgcolor: 0x130C19,
      fogcolor: 0x130C19,
      color1: 0x2A2763,
      color2: 0xFF5449,
      color3: 0xFF8748
    }

    $(document).ready(() => {
      this.init()
      this.resize()
    })
  }

  init() {

    // canvas
    this.$canvas = $('#canvas')

    // clock
    this.clock = new THREE.Clock()

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

    // mouse handlers
    $(document).click(() => { this.click() })
    $(document).mousedown(() => { this.mousedown() })
    $(document).mouseup(() => { this.mouseup() })
    //$(document).mousemove((event) => { this.mousemove(event) })
  }

  createWorld() {
    this.landscapeBottom = new Landscape()
    this.landscapeBottom.position.y = -300.0
    this.scene.add(this.landscapeBottom)

    this.landscapeTop = new Landscape()
    this.landscapeTop.rotation.z = Math.PI
    this.landscapeTop.position.y = 300.0
    this.scene.add(this.landscapeTop)

    this.trails = []
    // this.spawnTrail()
    // for(let i = 0; i < 8; i++) {
    //   setTimeout(() => {
    //     this.spawnTrail()
    //   }, i * 1000)
    // }

    // this.light1 = new THREE.PointLight(this.parameters.color1, 30, 500)
    // this.light1.position.set(0, 0, -500)
    // this.scene.add(this.light1)

    // this.light2 = new THREE.PointLight(this.parameters.color2, 30, 250)
    // this.light2.position.set(150, -50, -250)
    // this.scene.add(this.light2)

    // this.light3 = new THREE.PointLight(this.parameters.color3, 25, 350)
    // this.light3.position.set(-150, 50, -150)
    // this.scene.add(this.light3)
  }

  spawnTrail() {
    let trail = new Trail(this.scene, this.clock, this.landscapeBottom)
    this.scene.add(trail)
    this.trails.push(trail)
  }

  tick() {
    this.update()
    this.draw()
  }

  update() {
    if(this.landscapeBottom) this.landscapeBottom.update()
    if(this.landscapeTop) this.landscapeTop.update()
    if(this.trails && this.trails.length) {
      _.each(this.trails, (trail) => {
        trail.update()
      })
    }

    //this.camera.position.y = 50.0 + (-Math.cos(this.clock.getElapsedTime() / 2) * 50.0)
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

  click() {
    // this.landscapeTop.animateToNextColor()
    // this.landscapeBottom.animateToNextColor()
  }

  mousedown() {
    // this.renderer.autoClearColor = false
  }

  mouseup() {
    // this.renderer.autoClearColor = true
  }

  mousemove(event) {
    let x = (event.clientX / window.innerWidth) * 2 - 1
    let y = -(event.clientY / window.innerHeight) * 2 + 1

    if(this.landscapeTop.meshes && this.landscapeTop.meshes.length) {
      _.each(this.landscapeTop.meshes, (mesh) => {
        mesh.rotation.y = Math.PI / 2 * x
      })
    }

    if(this.landscapeBottom.meshes && this.landscapeBottom.meshes.length) {
      _.each(this.landscapeBottom.meshes, (mesh) => {
        mesh.rotation.y = Math.PI / 2 * x
      })
    }
  }

  setupGui() {
    this.gui = new dat.GUI()
    dat.gui.GUI.toggleHide()

    // Colors
    let colorFolder = this.gui.addFolder('Colors')
    colorFolder.open()
    colorFolder.addColor(this.parameters, 'bgcolor').onChange((value) => { this.renderer.setClearColor(value) })
    colorFolder.addColor(this.parameters, 'fogcolor').onChange((value) => { this.fog.color.set(value) })
    colorFolder.addColor(this.parameters, 'color1').onChange((value) => { this.light1.color.set(value) })
    colorFolder.addColor(this.parameters, 'color2').onChange((value) => { this.light2.color.set(value) })
    colorFolder.addColor(this.parameters, 'color3').onChange((value) => { this.light3.color.set(value) })
  }
}

// export already created instance
export let app = new App()
