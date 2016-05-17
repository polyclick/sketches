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
    this.renderer.autoClearColor = false;

    // camera
    this.camera = new THREE.PerspectiveCamera(70, this.sceneWidth / this.sceneHeight, 1, 1000)
    this.camera.position.z = 0

    // scene & world
    this.scene = new THREE.Scene()
    //this.scene.fog = new THREE.FogExp2(0x000000, 0.0025);
    this.createWorld()

    // render & animation ticker
    TweenMax.ticker.fps(60)
    TweenMax.ticker.addEventListener('tick', () => { this.tick() })

    // resize handler, resize once
    $(window).resize(() => { this.resize() })

    // mouse handlers
    $(document).mousedown(() => { this.mousedown() })
    $(document).mouseup(() => { this.mouseup() })
    $(document).mousemove((event) => { this.mousemove(event) })
  }

  createWorld() {
    this.landscapeBottom = new Landscape()
    this.landscapeBottom.position.y = 0.0
    this.scene.add(this.landscapeBottom)
  }

  tick() {
    this.update()
    this.draw()
  }

  update() {
    if(this.landscapeBottom) this.landscapeBottom.update()

    this.camera.position.x = 3.0 + (-Math.sin(this.clock.getElapsedTime()) * 3.0)
    this.camera.position.y = 2.0 + (-Math.cos(this.clock.getElapsedTime() / 3) * 10.0)
    this.camera.rotation.z = this.clock.getElapsedTime() * 15
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
    console.log('hier')
    this.renderer.autoClearColor = true
    //this.camera.fov = 120
    //this.camera.updateProjectionMatrix()
  }

  mouseup() {
    console.log('daar')
    this.renderer.autoClearColor = false
    //this.camera.fov = 70
    //this.camera.updateProjectionMatrix()
  }

  mousemove(event) {
    // let mouseX = (event.clientX / this.sceneWidth) * 2 - 1
    // let mouseY = -(event.clientY / this.sceneHeight) * 2 + 1
    // if(this.landscapeBottom) {
    //   TweenMax.to(this.landscapeBottom.rotation, 0.1, {z:Math.PI * 4 * mouseX})
    // }
  }
}

// export already created instance
export let app = new App()
