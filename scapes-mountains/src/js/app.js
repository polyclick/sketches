import $ from 'jquery'
import _ from 'lodash'
import TweenMax from 'gsap'

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
    this.scene = null

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

    // clock
    this.clock = new THREE.Clock()

    // renderer
    this.renderer = new THREE.WebGLRenderer({ canvas: this.$canvas[0], antialias: true, preserveDrawingBuffer: true })
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(this.sceneWidth, this.sceneHeight)

    // camera
    this.camera = new THREE.PerspectiveCamera(70, this.sceneWidth / this.sceneHeight, 1, 1000)
    this.camera.position.z = 250

    // scene & world
    this.scene = new THREE.Scene()
    this.createWorld()

    // render & animation ticker
    TweenMax.ticker.fps(60)
    TweenMax.ticker.addEventListener('tick', () => { this.tick() })

    // resize handler, resize once
    $(window).resize(() => { this.resize() })

    // mouse handlers
    $(document).mousedown(() => { this.mousedown() })
    $(document).mouseup(() => { this.mouseup() })
    $(document).mousemove(() => { this.mousemove() })
  }

  createWorld() {
    this.landscapeBottom = new Landscape()
    this.landscapeBottom.position.y = -200.0
    this.scene.add(this.landscapeBottom)

    this.landscapeTop = new Landscape()
    this.landscapeTop.rotation.z = Math.PI
    this.landscapeTop.position.y = 200.0
    this.scene.add(this.landscapeTop)

    this.trails = []
    this.spawnTrail()
    for(let i = 0; i < 8; i++) {
      setTimeout(() => {
        this.spawnTrail()
      }, i * 1000)
    }
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

  mousedown() {
    this.renderer.autoClearColor = false
  }

  mouseup() {
    this.renderer.autoClearColor = true
  }

  mousemove() {

  }
}

// export already created instance
export let app = new App()
