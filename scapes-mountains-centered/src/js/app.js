import $ from 'jquery'
import _ from 'lodash'
import TweenMax from 'gsap'

// import three and make it global
// so plugins can hook onto the namespace THREE
import THREE from 'three'
window.THREE = THREE

import 'three/loaders/OBJLoader'
import ConvolutionShader from 'three/shaders/ConvolutionShader'
import CopyShader from 'three/shaders/CopyShader'
import EffectComposer from 'three/postprocessing/EffectComposer'
import MaskPass from 'three/postprocessing/MaskPass'
import RenderPass from 'three/postprocessing/RenderPass'
import ShaderPass from 'three/postprocessing/ShaderPass'
import BloomPass from 'three/postprocessing/BloomPass'

import './util.js'

import { Landscape } from './landscape.js'

// application
class App {
  constructor() {
    this.$canvas = null

    this.clock = null
    this.renderer = null
    this.camera = null
    this.composer = null
    this.renderPass = null

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
    this.renderer.setClearColor(0x151432)

    // camera
    this.camera = new THREE.PerspectiveCamera(90, this.sceneWidth / this.sceneHeight, 1, 1000)
    this.camera.position.z = 0

    // scene & world
    this.scene = new THREE.Scene()
    this.createWorld()

    // composer
    this.composer = new THREE.EffectComposer(this.renderer)

    // render pass, will render the scene from the camera perspective to the framebuffer
    let renderPass = new THREE.RenderPass(this.scene, this.camera)
    this.composer.addPass(renderPass)

    // adds a bloom to the previous pass
    let bloomPass = new THREE.BloomPass(1, 25, 4.0, 1024)
    bloomPass.enabled = true
    this.composer.addPass(bloomPass)

    // copies the previous pass and sets it as the end of the post processing filter chain
    let effectCopy = new THREE.ShaderPass(THREE.CopyShader)
    effectCopy.renderToScreen = true
    this.composer.addPass(effectCopy)

    // render & animation ticker
    TweenMax.ticker.fps(60)
    TweenMax.ticker.addEventListener('tick', () => { this.tick() })

    // resize handler, resize once
    $(window).resize(() => { this.resize() })
  }

  createWorld() {
    this.landscapeBottom = new Landscape()
    this.landscapeBottom.position.x = -100.0
    this.landscapeBottom.rotation.z = degToRad(-90)
    this.scene.add(this.landscapeBottom)

    this.landscapeTop = new Landscape()
    this.landscapeTop.position.x = 100.0
    this.landscapeTop.rotation.z = degToRad(90)
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
    let delta = this.clock.getDelta()
    this.composer.render(delta)
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
