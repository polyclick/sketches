// libraries
import * as THREE from 'three'
import TweenMax from 'gsap'
import dat from 'dat.gui/build/dat.gui.min.js'

// includes
import FastSimplexNoise from './fast-simplex-noise.js'

// application
class App {

  constructor() {
    this.canvas = null
    this.renderer = null
    this.camera = null
    this.scene = null
    this.mesh = null

    this.config = {
      blob: {
        detail: 3,

        minRadius: 100,
        maxRadius: 200,

        amplitude: 1.0,
        frequency: 0.4,
        octaves: 1,
        persistence: 0.5,

        smoothing: 3
      }
    }

    this.sceneWidth = window.innerWidth
    this.sceneHeight = window.innerHeight

    this.init()
    this.resize()
  }

  init() {

    // canvas
    this.canvas = document.getElementById(`canvas`)

    // renderer
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true })
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(this.sceneWidth, this.sceneHeight)

    // camera
    this.camera = new THREE.PerspectiveCamera(70, this.sceneWidth / this.sceneHeight, 1, 1000)
    this.camera.position.z = 3

    // scene & world
    this.scene = new THREE.Scene()
    this.createWorld()
    this.createGui()

    // render & animation ticker
    TweenMax.ticker.fps(60)
    TweenMax.ticker.addEventListener(`tick`, () => { this.tick() })

    // resize
    window.addEventListener(`resize`, () => { this.resize() }, false)
  }

  createWorld() {

    while(this.scene.children.length > 0) this.scene.remove(this.scene.children[0])

    // create noise
    const noise = new FastSimplexNoise(this.config.blob)

    // create world here
    let radius = 0.7
    let smoothing = this.config.blob.smoothing
    let geometry = this.displace(new THREE.IcosahedronGeometry(radius, this.config.blob.detail), noise, smoothing)
    let material = new THREE.MeshBasicMaterial({ color: `#333`, wireframe: true })
    this.mesh = new THREE.Mesh(geometry, material)
    this.scene.add(this.mesh)
  }

  createGui() {
    this.gui = new dat.GUI()
    this.gui.add(this.config.blob, `detail`, {low: 1, medium: 3, high: 5}).onFinishChange(() => this.createWorld())
    this.gui.add(this.config.blob, `frequency`, 0, 1).onFinishChange(() => this.createWorld())
    this.gui.add(this.config.blob, `octaves`, 1, 10).onFinishChange(() => this.createWorld())
    this.gui.add(this.config.blob, `smoothing`, {none: 1, medium: 3, high: 15}).onFinishChange(() => this.createWorld())
  }

  displace(baseGeometry, noise, smoothing) {
    let vertex, displace
    for(let i = 0; i < baseGeometry.vertices.length; i++) {
      vertex = baseGeometry.vertices[i]
      displace = noise.get3DNoise(vertex.x, vertex.y, vertex.z)
      vertex.multiplyScalar(1 + displace / smoothing)
    }
    return baseGeometry
  }

  tick() {
    this.update()
    this.draw()
  }

  update() {
    this.mesh.rotation.x += 0.0025
    this.mesh.rotation.y += 0.001
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
export new App()
