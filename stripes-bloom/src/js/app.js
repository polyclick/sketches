import $ from 'jquery'
import _ from 'lodash'
import TweenMax from 'gsap'

// import three and make it global
// so plugins can hook onto the namespace THREE
import THREE from 'three'
window.THREE = THREE

import ConvolutionShader from 'three/shaders/ConvolutionShader'
import CopyShader from 'three/shaders/CopyShader'
import EffectComposer from 'three/postprocessing/EffectComposer'
import MaskPass from 'three/postprocessing/MaskPass'
import RenderPass from 'three/postprocessing/RenderPass'
import ShaderPass from 'three/postprocessing/ShaderPass'
import BloomPass from 'three/postprocessing/BloomPass'

class App {
  constructor() {
    this.canvas = null
    this.clock = null
    this.renderer = null
    this.camera = null
    this.composer = null
    this.renderPass = null

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
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true })
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(this.screenWidth, this.screenHeight)

    // camera
    this.camera = new THREE.PerspectiveCamera(70, this.screenWidth / this.screenHeight, 1, 1000)
    this.camera.position.z = 500



    // scene
    this.scene = new THREE.Scene()

    // create world
    this.createWorld();



    // composer
    this.composer = new THREE.EffectComposer(this.renderer)

    // render pass, will render the scene from the camera perspective to the framebuffer
    let renderPass = new THREE.RenderPass(this.scene, this.camera)
    this.composer.addPass(renderPass)

    // adds a bloom to the previous pass
    let bloomPass = new THREE.BloomPass(5, 50, 1.25, 512)
    bloomPass.enabled = true;
    this.composer.addPass(bloomPass)

    // copies the previous pass and sets it as the end of the post processing filter chain
    let effectCopy = new THREE.ShaderPass(THREE.CopyShader);
    effectCopy.renderToScreen = true;
    this.composer.addPass(effectCopy);



    // render & animation ticker
    TweenMax.ticker.fps(60)
    TweenMax.ticker.addEventListener('tick', () => { this.tick() })

    // resize handler, resize once
    this.resizeHandler()
    $(window).resize(() => { this.resizeHandler() })



    // sweep
    this.sweep()
  }

  createWorld() {

    // empty meshes
    this.meshes = []

    // params to create meshes
    let count = 200
    let colors = ['#FDF000', '#00AB75']
    let sizes = [10, 50, 100, 135, 185]

    // create them
    for(let i = 0 ; i < count ; i++) {

      // pick random color but biased to #ffffff
      let color = Math.random() > 0.9 ? colors[Math.round(Math.random())] : '#999999'

      // geometry
      let geometry = new THREE.CylinderGeometry(1, 1, sizes[Math.round(Math.random() * (sizes.length - 1))], 4)
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
      this.sweepMesh(mesh)
    })
  }

  sweepMesh(mesh) {
    let times = [1.0, 2.0, 3.0]

    // time to move
    let time = times[Math.round(Math.random() * (times.length - 1))] + (Math.random() * 2.0)

    // start & end position (x)
    let startPosition = this.visibleRectWidthHalf + 200.0
    let endPosition = -this.visibleRectWidthHalf - 200.0

    // random y distribution
    let yDistribution = (Math.random() * this.visibleRectHeight) - this.visibleRectHeightHalf

    let endYDistribution = true ? yDistribution : (Math.random() * this.visibleRectHeight) - this.visibleRectHeightHalf

    // initial position & animate
    mesh.position.set(startPosition, yDistribution, 0)
    TweenMax.to(mesh.position, time, {
      x: endPosition,
      y: endYDistribution,
      ease: Power1.easeInOut,
      onComplete: () => {
        this.sweepMesh(mesh)
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
    //this.renderer.render(this.scene, this.camera)
    let delta = this.clock.getDelta()
    this.composer.render(delta)
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
