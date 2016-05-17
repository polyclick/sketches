import $ from 'jquery'
import _ from 'lodash'
import TweenMax from 'gsap'
import 'dat-gui'

// import three and make it global
// so plugins can hook onto the namespace THREE
import THREE from 'three'
window.THREE = THREE

import 'three/shaders/ConvolutionShader'
import 'three/shaders/CopyShader'
import 'three/shaders/VignetteShader'
import 'three/shaders/HorizontalBlurShader'
import 'three/shaders/VerticalBlurShader'
import 'three/postprocessing/EffectComposer'
import 'three/postprocessing/MaskPass'
import 'three/postprocessing/RenderPass'
import 'three/postprocessing/ShaderPass'
import 'three/postprocessing/BloomPass'
import 'three/postprocessing/ClearPass'
import 'three/postprocessing/MaskPass'
import 'three/postprocessing/TexturePass'

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

    // gui
    this.guiParams = {
      backgroundColor:0x541278,
      color1:0x208dbb,
      color2:0xff0096,
      color3:0xa800ff,

      vignettePassEnabled: true,
      vignetteOffset: 0.7,
      vignetteDarkness: 2.8,

      firstPassEnabled: true,
      secondPassEnabled: true,
      thirdPassEnabled: true,

      firstPassRadius: 30,
      secondPassRadius: 16,
      thirdPassRadius: 12
    }

    this.gui()

    // renderer
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: false })
    this.renderer.autoClear = false
    // this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(this.canvasWidth, this.canvasHeight)

    // create world
    this.blurScene = new BlurScene(this.canvasWidth, this.canvasHeight, this.renderer)
    this.heroScene = new HeroScene(this.canvasWidth, this.canvasHeight, this.renderer)

    // postprocessing
    this.setupPostProcessing()

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
    this.renderer.setClearColor(0xFFffff)
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

    var clearPass = new THREE.ClearPass()
    var clearMaskPass = new THREE.ClearMaskPass()

    // render pass
    let blurSceneRenderPass = new THREE.RenderPass(this.blurScene.scene, this.blurScene.camera)
    blurSceneRenderPass.clear = false
    let heroSceneMaskPass = new THREE.MaskPass(this.heroScene.scene, this.heroScene.camera)
    heroSceneMaskPass.inverse = true
    let heroSceneRenderPass = new THREE.RenderPass(this.heroScene.scene, this.heroScene.camera)
    heroSceneRenderPass.clear = false

    // vignette pass
    let vignettePass = this.createVignettePass()

    // blur pass
    let blurPass1H = this.createHorizontalBlurPass(this.guiParams.firstPassRadius)
    let blurPass1V = this.createVerticalBlurPass(this.guiParams.firstPassRadius)
    let blurPass2H = this.createHorizontalBlurPass(this.guiParams.secondPassRadius)
    let blurPass2V = this.createVerticalBlurPass(this.guiParams.secondPassRadius)
    let blurPass3H = this.createHorizontalBlurPass(this.guiParams.thirdPassRadius)
    let blurPass3V = this.createVerticalBlurPass(this.guiParams.thirdPassRadius)

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
    this.composer.addPass(clearPass)
    this.composer.addPass(blurSceneRenderPass)
    this.composer.addPass(blurPass1H)
    this.composer.addPass(blurPass1V)
    this.composer.addPass(blurPass2H)
    this.composer.addPass(blurPass2V)
    this.composer.addPass(blurPass3H)
    this.composer.addPass(blurPass3V)
    this.composer.addPass(vignettePass)
    //this.composer.addPass(heroSceneRenderPass)
    this.composer.addPass(outputPass)
  }

  createVignettePass() {
    let pass = new THREE.ShaderPass(THREE.VignetteShader)
    pass.uniforms["offset"].value = this.guiParams.vignetteOffset
    pass.uniforms["darkness"].value = this.guiParams.vignetteDarkness
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

  gui() {
    this.gui = new dat.GUI()

    // // folders
    // var postFolder = this.gui.addFolder('Settings')
    // var colorFolder = postFolder.addFolder('Colors')
    // var vignetteFolder = postFolder.addFolder('Vignette')
    // var firstBlurFolder = postFolder.addFolder('1st Blur Pass')
    // var secondBlurFolder = postFolder.addFolder('2nd Blur Pass')
    // var thirdBlurFolder = postFolder.addFolder('3rd Blur Pass')

    // // Colors
    // colorFolder.addColor(this.guiParams, 'backgroundColor').name('Background Color').onChange(function(value){ this.renderer.setClearColor(value) })
    // colorFolder.addColor(this.guiParams, 'color1').name('Color 1').onChange(function(value){ createObjects() })
    // colorFolder.addColor(this.guiParams, 'color2').name('Color 2').onChange(function(value){ createObjects() })
    // colorFolder.addColor(this.guiParams, 'color3').name('Color 3').onChange(function(value){ createObjects() })
  }
}

// export already created instance
export let app = new App()
