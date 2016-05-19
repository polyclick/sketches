import $ from 'jquery'
import _ from 'lodash'
import TweenMax from 'gsap'

// import three and make it global
// so plugins can hook onto the namespace THREE
import THREE from 'three'
window.THREE = THREE

import './utils.js'

class App {
  constructor() {
    this.canvas = null
    this.clock = null
    this.renderer = null
    this.camera = null

    this.scene = null
    this.meshes = null

    this.screenWidth = window.innerWidth
    this.screenHeight = window.innerHeight

    this.visibleRectWidth = 0.0         // the unprojected screen width/height
    this.visibleRectHeight = 0.0        // the unprojected screen width/height
    this.visibleRectWidthHalf = 0.0     // the unprojected screen width/height
    this.visibleRectHeightHalf = 0.0    // the unprojected screen width/height

    $(document).ready(() => { this.init() })
  }

  init() {

    // canvas
    this.canvas = document.getElementById('canvas')

    // clock
    this.clock = new THREE.Clock()

    // renderer
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: false })
    //this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(this.screenWidth, this.screenHeight)

    // camera
    this.camera = new THREE.PerspectiveCamera(70, this.screenWidth / this.screenHeight, 1, 1000)
    this.camera.position.z = 500

    // scene
    this.scene = new THREE.Scene()

    // create world
    this.createWorld();

    // render & animation ticker
    TweenMax.ticker.fps(60)
    TweenMax.ticker.addEventListener('tick', () => { this.tick() })

    // resize handler, resize once
    this.resizeHandler()
    $(window).resize(() => { this.resizeHandler() })

    // sweep
    this.sweep()

    // fade out overlay
    TweenMax.to($('#overlay'), 2.0, {delay: 1.0, opacity: 0});
  }

  createWorld() {

    // empty meshes
    this.meshes = []

    // params to create meshes
    let count = 350
    let colors = ['#FFE748', '#864DFF']
    let sizes = [10, 50, 100, 135, 185]

    // create them
    for(let i = 0 ; i < count ; i++) {

      // pick random color but biased to #ffffff
      let color = Math.random() > 0.8 ? colors[Math.round(Math.random())] : '#ffffff'

      // geometry
      let geometry = new THREE.CylinderGeometry(1, 1, randomFromArray(sizes), 4)
      let material = new THREE.MeshBasicMaterial({ color: color, wireframe:false, blending: THREE.AdditiveBlending })

      // position everything
      let mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(0, 0, 0)
      mesh.rotation.set(0, 0, Math.PI / 2)

      // add to scene and keep track
      this.scene.add(mesh)
      this.meshes.push(mesh)
    }
  }

  sweep() {
    _.each(this.meshes, (mesh) => {
      this.sweepMesh(mesh, Math.random() * 3)
    })
  }

  sweepMesh(mesh, delay) {

    // time to move
    let time = randomBetween(2.0, 5.0)

    // frustrum
    let frustrum = frustrumSizeForCamera(this.camera, this.screenWidth, this.screenHeight)

    // start & end position (x)
    let xPosition = (frustrum.width / 2) + 200.0
    let xPositionEnd = (frustrum.width / -2) - 200.0

    // y distribution (add some banding)
    let banding = frustrum.height * 0.25
    let yPosition = randomBetween((frustrum.height / -2) - banding, (frustrum.height / 2) + banding)
    let yPositionEnd = randomBetween((frustrum.height / -2) - banding, (frustrum.height / 2) + banding)

    // initial position & animate
    mesh.position.set(xPosition, yPosition, 0)
    TweenMax.to(mesh.position, time, {
      delay: delay,
      x: xPositionEnd,
      y: yPositionEnd,
      ease: Linear.easeNone,
      onComplete: () => {
        this.sweepMesh(mesh, 0)
      }
    })
  }

  tick() {
    this.animate()
    this.render()
  }

  animate() {

  }

  render() {
    this.renderer.render(this.scene, this.camera)
    let delta = this.clock.getDelta()
  }

  resizeHandler() {

    // update vars
    this.screenWidth = window.innerWidth
    this.screenHeight = window.innerHeight

    // update camera
    this.camera.aspect = this.screenWidth / this.screenHeight
    this.camera.updateProjectionMatrix()

    // update renderer
    this.renderer.setSize(this.screenWidth, this.screenHeight)

    // update visible rect
    this.visibleRectHeight = 2.0 * this.camera.position.z * Math.tan(this.camera.fov / 2 * (Math.PI / 180))
    this.visibleRectWidth = this.visibleRectHeight * (this.screenWidth / this.screenHeight)
    this.visibleRectHeightHalf = this.visibleRectHeight / 2.0
    this.visibleRectWidthHalf = this.visibleRectWidth / 2.0
  }
}

// export already created instance
export let app = new App()
