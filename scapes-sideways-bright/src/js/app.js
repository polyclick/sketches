import $ from 'jquery'
import _ from 'lodash'
import TweenMax from 'gsap'

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
    this.scene = null

    this.sceneWidth = window.innerWidth
    this.sceneHeight = window.innerHeight

    $(document).ready(() => {
      this.init()
      this.resize()
      this.show()
    })

    $(window).load(() => {
      this.show()
    })
  }

  init() {

    // elements
    this.$title = $('.title')
    this.$canvas = $('#canvas')
    this.$overlay = $('.overlay')

    // renderer
    this.renderer = new THREE.WebGLRenderer({ canvas: this.$canvas[0], antialias: true, preserveDrawingBuffer: true })
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(this.sceneWidth, this.sceneHeight)

    // camera
    this.camera = new THREE.PerspectiveCamera(70, this.sceneWidth / this.sceneHeight, 1, 1000)
    this.camera.position.z = 0
    this.camera.rotation.x = Math.PI / -7

    // scene & world
    this.scene = new THREE.Scene()
    this.scene.fog = new THREE.FogExp2('#ffffff', 0.002)
    this.createWorld()

    // render & animation ticker
    TweenMax.ticker.fps(60)
    TweenMax.ticker.addEventListener('tick', () => { this.tick() })

    // handlers
    $(window).resize(() => { this.resize() })

    $('.title').click(() => {
      TweenMax.to(this.landscapeLeft.rotation, 1.5, {x:Math.PI / 2});
      TweenMax.to(this.landscapeLeft.position, 1.5, {z:-375, y:-500});
      TweenMax.to(this.camera.rotation, 1.5, {x:0});
      TweenMax.to(this.landscapeLeft, 30.0, {speed:0.15});
    })
  }

  show() {
    TweenMax.to(this.$overlay, 1.0, {
      opacity:0,
      delay:0.5,
      onComplete:() => {
        this.$overlay.hide()
      }
    })

    TweenMax.from(this.$title, 1.0, {marginTop: '+=1.0%', delay:0.5, ease:Power2.easeOut})
  }

  createWorld() {
    this.landscapeLeft = new Landscape()
    //this.landscapeLeft.rotation.z = -Math.PI
    //this.landscapeLeft.position.x = -250.0
    this.landscapeLeft.position.y = -125.0
    this.scene.add(this.landscapeLeft)

    this.landscapeRight = new Landscape()
    this.landscapeRight.rotation.z = Math.PI / 2
    this.landscapeRight.position.x = 250.0
    //this.scene.add(this.landscapeRight)
  }

  tick() {
    this.update()
    this.draw()
  }

  update() {
    if(this.landscapeLeft) this.landscapeLeft.update()
    if(this.landscapeRight) this.landscapeRight.update()
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
}

// export already created instance
export let app = new App()
