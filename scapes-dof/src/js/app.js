import $ from 'jquery'
import _ from 'lodash'
import TweenMax from 'gsap'
import dat from 'dat-gui'

// import three and make it global
// so plugins can hook onto the namespace THREE
import THREE from 'three'
window.THREE = THREE

import 'three/loaders/OBJLoader'
import BokehShader from 'three/shaders/BokehShader2'

import { Landscape } from './landscape.js'
import { Trail } from './trail.js'
import { Logo } from './logo.js'

// application
class App {
  constructor() {
    this.$canvas = null

    this.clock = null
    this.renderer = null
    this.camera = null
    this.scene = null

    this.depthMaterial = null
    this.post = {}
    this.gui = null

    this.sceneWidth = window.innerWidth
    this.sceneHeight = window.innerHeight

    $(document).ready(() => {
      this.init()
      this.resize()
    })
  }

  init() {

    // vars
    this.sceneWidth = window.innerWidth
    this.sceneHeight = window.innerHeight

    // canvas
    this.$canvas = $('#canvas')

    // clock
    this.clock = new THREE.Clock()

    // renderer
    this.renderer = new THREE.WebGLRenderer({ canvas: this.$canvas[0], antialias: false, preserveDrawingBuffer: true })
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(this.sceneWidth, this.sceneHeight)
    this.renderer.setClearColor(0x101432)

    // camera
    this.camera = new THREE.PerspectiveCamera(90, this.sceneWidth / this.sceneHeight, 1, 1000)
    this.camera.position.z = 0

    // depth material (for post processing)
    this.depthMaterial = new THREE.MeshDepthMaterial()

    // scene & world
    this.scene = new THREE.Scene()
    this.addLights()
    this.createWorld()

    // render & animation ticker
    TweenMax.ticker.fps(60)
    TweenMax.ticker.addEventListener('tick', () => { this.tick() })

    // dat gui
    this.effectController = {
      enabled: true,
      jsDepthCalculation: true,
      shaderFocus: false,

      fstop: 2.2,
      maxblur: 1.0,

      showFocus: false,
      focalDepth: 2.8,
      manualdof: false,
      vignetting: false,
      depthblur: false,

      threshold: 0.5,
      gain: 2.0,
      bias: 0.5,
      fringe: 0.7,

      focalLength: 35,
      noise: true,
      pentagon: false,

      dithering: 0.0001
    }

    // init gui
    this.initGui()

    // init post processing
    this.initPostProcessing()

    // resize handler, resize once
    $(window).resize(() => { this.resize() })

    // mouse handlers
    $(document).mousedown(() => { this.mousedown() })
    $(document).mouseup(() => { this.mouseup() })
    $(document).mousemove(() => { this.mousemove() })
  }

  addLights() {

    // create hemi light
    let hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.3)
    hemiLight.color.setHSL(0.6, 1, 0.6)
    hemiLight.groundColor.setHSL(0.095, 1, 0.75)
    hemiLight.position.set(0, 500, 0)
    this.scene.add(hemiLight)

    // create directional light
    let d = 1000
    let dirLight = new THREE.DirectionalLight(0xffffff, 1)
    dirLight.color.setHSL(0.1, 0.75, 0.7)
    dirLight.position.set(190, 190, 150)
    dirLight.castShadow = true
    dirLight.shadow.mapSize.width = 2048
    dirLight.shadow.mapSize.height = 2048
    dirLight.shadow.camera.left = -d
    dirLight.shadow.camera.right = d
    dirLight.shadow.camera.top = d
    dirLight.shadow.camera.bottom = -d
    dirLight.shadow.camera.far = 5000
    dirLight.shadow.bias = -0.00001
    this.scene.add(dirLight)
  }

  createWorld() {
    this.landscapeBottom = new Landscape()
    this.landscapeBottom.position.y = -100.0
    this.scene.add(this.landscapeBottom)

    this.landscapeTop = new Landscape()
    this.landscapeTop.rotation.z = Math.PI
    this.landscapeTop.position.y = 200.0
    //this.scene.add(this.landscapeTop)

    this.trails = []
    this.spawnTrail()
    for(let i = 0; i < 8; i++) {
      setTimeout(() => {
        this.spawnTrail()
      }, i * 1000)
    }

    this.logo = new Logo()
    this.logo.position.z = -20
    //this.scene.add(this.logo)
  }

  spawnTrail() {
    let trail = new Trail(this.scene, this.clock, this.landscapeBottom)
    this.scene.add(trail)
    this.trails.push(trail)
  }

  initPostProcessing(){
    this.post.scene = new THREE.Scene()
    this.post.camera = new THREE.OrthographicCamera( this.sceneWidth / - 2, this.sceneWidth / 2,  this.sceneHeight / 2, this.sceneHeight / - 2, -10000, 10000 );
    //this.post.camera.position.z = 100;

    this.post.scene.add( this.post.camera )

    let pars = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat }
    this.post.rtTextureDepth = new THREE.WebGLRenderTarget( this.sceneWidth, this.sceneHeight, pars )
    this.post.rtTextureColor = new THREE.WebGLRenderTarget( this.sceneWidth, this.sceneHeight, pars )

    let bokehShader = THREE.BokehShader

    this.post.bokehUniforms = THREE.UniformsUtils.clone(bokehShader.uniforms)
    this.post.bokehUniforms['tColor'].value = this.post.rtTextureColor
    this.post.bokehUniforms['tDepth'].value = this.post.rtTextureDepth

    this.post.bokehUniforms['textureWidth'].value = this.sceneWidth
    this.post.bokehUniforms['textureHeight'].value = this.sceneHeight

    this.post.materialBokeh = new THREE.ShaderMaterial({
      uniforms: this.post.bokehUniforms,
      vertexShader: bokehShader.vertexShader,
      fragmentShader: bokehShader.fragmentShader,
      defines: {
        RINGS: 3,
        SAMPLES: 4
      }
    })

    this.post.quad = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(this.sceneWidth, this.sceneHeight),
      this.post.materialBokeh
    )

    //this.post.quad.position.z = -500
    this.post.scene.add(this.post.quad)
  }

  initGui(){
    this.gui = new dat.GUI()

    this.gui.add( this.effectController, "enabled" ).onChange( () => { this.change() } );
    this.gui.add( this.effectController, "jsDepthCalculation" ).onChange( () => { this.change() } );
    this.gui.add( this.effectController, "shaderFocus" ).onChange( () => { this.change() } );
    this.gui.add( this.effectController, "focalDepth", 0.0, 200.0 ).listen().onChange( () => { this.change() } );

    this.gui.add( this.effectController, "fstop", 0.1, 22, 0.001 ).onChange( () => { this.change() } );
    this.gui.add( this.effectController, "maxblur", 0.0, 5.0, 0.025 ).onChange( () => { this.change() } );

    this.gui.add( this.effectController, "showFocus" ).onChange( () => { this.change() } );
    this.gui.add( this.effectController, "manualdof" ).onChange( () => { this.change() } );
    this.gui.add( this.effectController, "vignetting" ).onChange( () => { this.change() } );

    this.gui.add( this.effectController, "depthblur" ).onChange( () => { this.change() } );

    this.gui.add( this.effectController, "threshold", 0, 1, 0.001 ).onChange( () => { this.change() } );
    this.gui.add( this.effectController, "gain", 0, 100, 0.001 ).onChange( () => { this.change() } );
    this.gui.add( this.effectController, "bias", 0,3, 0.001 ).onChange( () => { this.change() } );
    this.gui.add( this.effectController, "fringe", 0, 5, 0.001 ).onChange( () => { this.change() } );

    this.gui.add( this.effectController, "focalLength", 16, 80, 0.001 ).onChange( () => { this.change() } );

    this.gui.add( this.effectController, "noise" ).onChange( () => { this.change() } );

    this.gui.add( this.effectController, "dithering", 0, 0.001, 0.0001 ).onChange( () => { this.change() } );

    this.gui.add( this.effectController, "pentagon" ).onChange( () => { this.change() } );
  }

  change(){
    _.each(this.effectController, (e, index) => {
      if(index in this.post.bokehUniforms){
        this.post.bokehUniforms[index].value = this.effectController[index]
      }
    })

    this.post.enabled = this.effectController.enabled
    this.post.bokehUniforms['znear'].value = this.camera.near
    this.post.bokehUniforms['zfar'].value = this.camera.far
    // this.camera.setFocalLength(this.effectController.focalLength)
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

    if(this.logo) {
      this.logo.position.x = Math.sin(this.clock.getElapsedTime() / 6) * 0.9
      this.logo.position.y = Math.cos(this.clock.getElapsedTime() / 5) * 0.8
    }

    // this.camera.position.y = 10.0 + (-Math.sin(this.clock.getElapsedTime() / 2) * 10.0)
  }

  draw() {
    // post
    if(this.post.enabled) {
      this.renderer.clear()

      // scene -> tex
      this.scene.overrideMaterial = null
      this.renderer.render(this.scene, this.camera, this.post.rtTextureColor, true)

      // depth -> texture
      this.scene.overrideMaterial = this.depthMaterial
      this.renderer.render(this.scene, this.camera, this.post.rtTextureDepth, true)

      // render bokeh
      this.renderer.render(this.post.scene, this.post.camera )
    } else {
      // no post
      this.renderer.render(this.scene, this.camera)
    }

  }

  resize() {
    // update post
    this.change()

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
