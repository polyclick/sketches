import $ from 'jquery'
import _ from 'lodash'
import TweenMax from 'gsap'
import 'dat-gui'

// import three and make it global
// so plugins can hook onto the namespace THREE
import THREE from 'three'
window.THREE = THREE

import EffectComposer from 'three/postprocessing/EffectComposer'
import CopyShader from 'three/shaders/CopyShader'
import VignetteShader from 'three/shaders/VignetteShader'
import HorizontalBlurShader from 'three/shaders/HorizontalBlurShader'
import VerticalBlurShader from 'three/shaders/VerticalBlurShader'
import RenderPass from 'three/postprocessing/RenderPass'
import ShaderPass from 'three/postprocessing/ShaderPass'
import MaskPass from 'three/postprocessing/MaskPass'

import { BlurScene } from './blur-scene.js'
import { HeroScene } from './hero-scene.js'

// application
class App {
  constructor() {

    this.canvasWidth = window.innerWidth
    this.canvasHeight = window.innerHeight
    this.canvas = null

    this.renderer = null

    this.mouseX = 0
    this.mouseY = 0

    $(document).ready(() => {
      this.init()
      this.start()
    })
  }

  init() {

    // todo: replace jquery with vanilla js to lower kbs
    // todo: replace lodash with vanilla js to lower kbs?

    // canvas
    this.canvas = document.getElementById('canvas')

    // parameters
    this.parameters = {
      bgcolor: 0x2A2763,
      color1: 0xFFE9B8,
      color2: 0x83E0FF,
      color3: 0x42A9FF,
      color4: 0xFF81FF,
      color5: 0xFF21A3
    }

    // renderer
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: false })
    this.renderer.autoClear = false
    this.renderer.setClearColor(this.parameters.bgcolor)
    // this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(this.canvasWidth, this.canvasHeight)

    // create world
    let colors = [this.parameters.color1, this.parameters.color2, this.parameters.color3, this.parameters.color4, this.parameters.color5]
    this.blurScene = new BlurScene(this.canvasWidth, this.canvasHeight, this.renderer, colors)
    this.heroScene = new HeroScene(this.canvasWidth, this.canvasHeight, this.renderer)

    // postprocessing
    this.setupPostProcessing()

    // gui
    this.setupGui()

    // resize handler
    $(window).resize(() => { this.resize() })

    // mouse move handler
    $(document).mousemove(() => { this.mousemove() })
  }

  start() {

    // resize just once to trigger resize logic
    this.resize()

    // configure animation ticker (will autostart animation)
    TweenMax.ticker.fps(60)
    TweenMax.ticker.addEventListener('tick', () => { this.tick() })
  }

  tick() {
    this.update()
    this.draw()
  }

  update() {
    this.blurScene.update()
    this.heroScene.update()
  }

  draw() {
    let time = performance.now() * 0.001
    this.renderer.clear()
    this.composer.render(time)

    this.renderer.clearDepth()
    this.renderer.antialias = true
    this.heroScene.draw()
    this.renderer.antialias = false
  }

  resize() {

    // update vars
    this.canvasWidth = window.innerWidth
    this.canvasHeight = window.innerHeight

    // resize scenes
    this.blurScene.resize(this.canvasWidth, this.canvasHeight)
    this.heroScene.resize(this.canvasWidth, this.canvasHeight)

    // update renderer
    this.renderer.setSize(this.canvasWidth, this.canvasHeight)
  }

  mousemove() {
    this.mouseX = (event.clientX / this.canvasWidth) * 2 - 1
    this.mouseY = - (event.clientY / this.canvasHeight) * 2 + 1

    this.heroScene.mousemove(this.mouseX, this.mouseY)
  }

  setupPostProcessing() {

    // render pass
    let blurSceneRenderPass = new THREE.RenderPass(this.blurScene.scene, this.blurScene.camera)
    blurSceneRenderPass.clear = false

    // vignette pass
    let vignettePass = this.createVignettePass()

    // blur pass
    let blurPass1H = this.createHorizontalBlurPass(30)
    let blurPass1V = this.createVerticalBlurPass(30)
    let blurPass2H = this.createHorizontalBlurPass(16)
    let blurPass2V = this.createVerticalBlurPass(16)
    let blurPass3H = this.createHorizontalBlurPass(12)
    let blurPass3V = this.createVerticalBlurPass(12)

    // output pass (renders to screen)
    let outputPass = new THREE.ShaderPass(THREE.CopyShader)
    outputPass.renderToScreen = true

    // var texturePass1 = new THREE.TexturePass( new THREE.TextureLoader().load( 'textures/bokeh.jpg' ) )

    var parameters = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBFormat,
      stencilBuffer: true
    }
    var renderTarget = new THREE.WebGLRenderTarget(this.canvasWidth, this.canvasHeight, parameters)




    // composer
    this.composer = new THREE.EffectComposer(this.renderer, renderTarget)
    this.composer.addPass(blurSceneRenderPass)
    this.composer.addPass(blurPass1H)
    this.composer.addPass(blurPass1V)
    this.composer.addPass(blurPass2H)
    this.composer.addPass(blurPass2V)
    this.composer.addPass(blurPass3H)
    this.composer.addPass(blurPass3V)
    this.composer.addPass(vignettePass)
    this.composer.addPass(outputPass)
  }

  createVignettePass() {
    let pass = new THREE.ShaderPass(THREE.VignetteShader)
    pass.uniforms["offset"].value = 0.7
    pass.uniforms["darkness"].value = 2.8
    return pass
  }

  createHorizontalBlurPass(radius) {
    let pass = new THREE.ShaderPass(THREE.HorizontalBlurShader)
    pass.uniforms['h'].value = radius / this.canvasWidth
    return pass
  }

  createVerticalBlurPass(radius) {
    let pass = new THREE.ShaderPass(THREE.VerticalBlurShader)
    pass.uniforms['v'].value = radius / this.canvasHeight
    return pass
  }

  setupGui() {
    this.gui = new dat.GUI()
    //dat.gui.GUI.toggleHide()

    let letters = ['O', 'F', 'F', 'F']
    for(let i = 0; i < letters.length; i++) {
      let letterFolder = this.gui.addFolder('Letter ' + (i === 0 ? letters[i] : letters[i] + ' ' + i))
      letterFolder.add(this.heroScene.startValues[i].position, 'x').step(0.01)
      letterFolder.add(this.heroScene.startValues[i].position, 'y').step(0.01)
      letterFolder.add(this.heroScene.startValues[i].position, 'z').step(0.01)
      letterFolder.add(this.heroScene.startValues[i].rotation, 'x').step(0.01)
      letterFolder.add(this.heroScene.startValues[i].rotation, 'y').step(0.01)
      letterFolder.add(this.heroScene.startValues[i].rotation, 'z').step(0.01)
      letterFolder.add(this.heroScene.startValues[i].scale, 'x').step(0.01)
      letterFolder.add(this.heroScene.startValues[i].scale, 'y').step(0.01)
      letterFolder.add(this.heroScene.startValues[i].scale, 'z').step(0.01)
    }

    // Colors
    let colorFolder = this.gui.addFolder('Colors')
    colorFolder.open()
    colorFolder.addColor(this.parameters, 'bgcolor').onChange((value) => { this.renderer.setClearColor(this.parameters.bgcolor) })
    colorFolder.addColor(this.parameters, 'color1').onChange((value) => { this.blurScene.updateColor(0, this.parameters.color1) })
    colorFolder.addColor(this.parameters, 'color2').onChange((value) => { this.blurScene.updateColor(1, this.parameters.color2) })
    colorFolder.addColor(this.parameters, 'color3').onChange((value) => { this.blurScene.updateColor(2, this.parameters.color3) })
    colorFolder.addColor(this.parameters, 'color4').onChange((value) => { this.blurScene.updateColor(3, this.parameters.color4) })
    colorFolder.addColor(this.parameters, 'color5').onChange((value) => { this.blurScene.updateColor(4, this.parameters.color5) })
  }
}

// export already created instance
export let app = new App()
