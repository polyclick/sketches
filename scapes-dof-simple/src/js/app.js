import $ from 'jquery'
import _ from 'lodash'
import TweenMax from 'gsap'

// import three and make it global
// so plugins can hook onto the namespace THREE
import THREE from 'three'
window.THREE = THREE

import 'three/loaders/OBJLoader'
import 'three/shaders/CopyShader'
import 'three/shaders/BokehShader'

import 'three/postprocessing/EffectComposer'
import 'three/postprocessing/RenderPass'
import 'three/postprocessing/ShaderPass'
import 'three/postprocessing/MaskPass'
import 'three/postprocessing/BokehPass'

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
    this.renderer.setClearColor(0x101432)

    // camera
    this.camera = new THREE.PerspectiveCamera(90, this.sceneWidth / this.sceneHeight, 1, 1000)
    this.camera.position.z = 0

    // scene & world
    this.scene = new THREE.Scene()
    this.addLights()
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

  addLights() {
    var d = 1000,
      hemiLight,
      dirLight;

    // create hemi light
    hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.3 );
    hemiLight.color.setHSL( 0.6, 1, 0.6 );
    hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
    hemiLight.position.set( 0, 500, 0 );
    this.scene.add( hemiLight );

    // create directional light
    dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
    dirLight.color.setHSL( 0.1, 0.75, 0.7 );
    dirLight.position.set( 190, 190, 150 );
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.camera.far = 5000;
    dirLight.shadow.bias = -0.00001;
    this.scene.add( dirLight );
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
    this.scene.add(this.logo)
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

    if(this.logo) {
      this.logo.position.x = Math.sin(this.clock.getElapsedTime() / 6) * 0.9
      this.logo.position.y = Math.cos(this.clock.getElapsedTime() / 5) * 0.8
    }

    // this.camera.position.y = 10.0 + (-Math.sin(this.clock.getElapsedTime() / 2) * 10.0)
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
