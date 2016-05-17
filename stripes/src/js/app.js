import $ from 'jquery'
import _ from 'lodash'
import TweenMax from 'gsap'

// import three and make it global
// so plugins can hook onto the namespace THREE
import THREE from 'three'
window.THREE = THREE

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
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true })
    this.renderer.setPixelRatio(window.devicePixelRatio)
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
    setInterval(() => { this.sweep() }, 4000)

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
    let count = 100
    let colors = ['#FDF000', '#00AB75']
    let sizes = [10, 50, 100, 135, 185]

    // create them
    for(let i = 0 ; i < count ; i++) {

      // pick random color but biased to #ffffff
      let color = Math.random() > 0.8 ? colors[Math.round(Math.random())] : '#ffffff'

      // geometry
      let geometry = new THREE.CylinderGeometry(1, 1, sizes[Math.round(Math.random() * (sizes.length - 1))], 16)
      let material = new THREE.MeshBasicMaterial({ color: color, wireframe:true })

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
    let times = [1.0, 2.0, 3.0]
    _.each(this.meshes, (mesh) => {
      let randomTime = times[Math.round(Math.random() * (times.length - 1))]
      mesh.position.set(-this.sceneWidth / 3, (Math.random() * this.sceneHeight / 2) - (this.sceneHeight / 4), 0)
      TweenMax.to(mesh.position, randomTime + (Math.random() * 1.0), {x: this.sceneWidth / 3, ease: Linear.easeNone})
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
