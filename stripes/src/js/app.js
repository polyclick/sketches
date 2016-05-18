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
    this.camera = null
    this.scene = null
    this.renderer = null
    this.meshes = null

    this.sceneWidth = window.innerWidth
    this.sceneHeight = window.innerHeight

    $(document).ready(() => { this.init() })
  }

  init() {

    // canvas
    this.canvas = document.getElementById('canvas')

    // renderer
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: false })
    //this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(this.sceneWidth, this.sceneHeight)

    // camera
    this.camera = new THREE.PerspectiveCamera(70, this.sceneWidth / this.sceneHeight, 1, 10000)
    this.camera.position.z = 500

    // scene
    this.scene = new THREE.Scene()

    // create world
    this.createWorld();

    // sweep every 4 seconds
    this.sweep()
    setInterval(() => { this.sweep() }, 5000)

    // render & animation ticker
    TweenMax.ticker.fps(60)
    TweenMax.ticker.addEventListener('tick', () => { this.tick() })

    // resize handler, resize once
    this.resizeHandler()
    $(window).resize(() => { this.resizeHandler() })
  }

  createWorld() {

    // empty meshes
    this.meshes = []

    // params to create meshes
    let count = 250
    let colors = ['#FF5D48', '#4DFFAE']
    let sizes = [10, 50, 100, 135, 185]

    // create them
    for(let i = 0 ; i < count ; i++) {

      // pick random color but biased to #ffffff
      let color = Math.random() > 0.85 ? randomFromArray(colors) : '#ffffff'

      // geometry
      let geometry = new THREE.CylinderGeometry(1, 1, randomFromArray(sizes), 8)
      let material = new THREE.MeshBasicMaterial({ color: color, wireframe:false })

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
    let frustrum = frustrumSizeForCamera(this.camera, this.sceneWidth, this.sceneHeight)
    _.each(this.meshes, (mesh) => {
      mesh.position.set(-((frustrum.width / 2) + randomBetween(100, 400)), randomBetween(-frustrum.height / 2, frustrum.height / 2), 0)
      TweenMax.to(mesh.position, randomBetween(2.5, 4.0), {x: ((frustrum.width / 2) + randomBetween(100, 400)), ease: Linear.easeNone})
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
  }

  resizeHandler() {

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
