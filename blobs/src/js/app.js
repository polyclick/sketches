// libraries
import * as THREE from 'three'
import TweenMax from 'gsap'
import dat from 'dat.gui/build/dat.gui.min.js'

// includes
import FastSimplexNoise from './fast-simplex-noise.js'



///////////////////////////////////////////////////////////////////////////////
//// APPLICATION CLASS
///////////////////////////////////////////////////////////////////////////////

class App {

  constructor() {
    this.canvas = null
    this.renderer = null
    this.camera = null
    this.scene = null
    this.mesh = null

    this.gui = null
    this.noiseCanvas = null

    this.config = {
      debug: false,
      blob: {
        detail: 4,

        minRadius: 100,
        maxRadius: 200,

        amplitude: 1.0,
        frequency: 0.4,
        octaves: 1,
        persistence: 0.5
      }
    }

    this.sceneWidth = window.innerWidth
    this.sceneHeight = window.innerHeight

    this.init()
    this.resize()
  }



  ///////////////////////////////////////////////////////////////////////////////
  //// SETUP
  ///////////////////////////////////////////////////////////////////////////////

  init() {

    // canvas
    this.canvas = document.getElementById(`canvas`)

    // renderer
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true })
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(this.sceneWidth, this.sceneHeight)

    // camera
    this.camera = new THREE.PerspectiveCamera(20, this.sceneWidth / this.sceneHeight, 1, 1000)
    this.camera.position.z = 5
    //this.camera = new THREE.OrthographicCamera( this.sceneWidth / - 2, this.sceneWidth / 2, this.sceneHeight / 2, this.sceneHeight / - 2, 1, 1000)


    // scene & world
    this.scene = new THREE.Scene()
    this.createWorld()
    this.createGui()

    // render & animation ticker
    TweenMax.ticker.fps(60)
    TweenMax.ticker.addEventListener(`tick`, () => { this.tick() })

    // resize
    window.addEventListener(`resize`, () => { this.resize() }, false)
    window.addEventListener(`keyup`, (event) => { this.handleKeyUp(event) }, false)
  }

  createWorld() {

    // add lights
    // ambient light
    let light = new THREE.AmbientLight(0xffffff, 0.1)
    this.scene.add(light)

    // viewer light
    light = new THREE.DirectionalLight(0xffffff, 0.4)
		light.position.set(this.camera.position.z / -2, this.camera.position.z / -2, this.camera.position.z)
    this.scene.add(light)
		if(this.config.debug) this.scene.add(new THREE.DirectionalLightHelper(light, 1))

    // back light 1 (left)
    light = new THREE.PointLight(0xffffff, 0.7)
		light.position.set(-4, 4, -2)
    this.scene.add(light)
		if(this.config.debug) this.scene.add(new THREE.PointLightHelper(light, 1))

    // back light 1 (right)
    light = new THREE.PointLight(0xffffff, 0.6)
		light.position.set(4, -4, -2)
    this.scene.add(light)
		if(this.config.debug) this.scene.add(new THREE.PointLightHelper(light, 1))
  }

  createGui() {
    if(!this.config.debug) return

    // gui controls
    this.gui = new dat.GUI()
    this.gui.add(this.config.blob, `detail`, {lowest: 1, low: 2, medium: 3, high: 4, highest: 5}).onChange(() => this.createWorld())
    this.gui.add(this.config.blob, `amplitude`, 0.1, 1.0).onChange(() => this.createWorld())
    this.gui.add(this.config.blob, `frequency`, 0.1, 1.0).onChange(() => this.createWorld())
    this.gui.add(this.config.blob, `octaves`, 1, 10).onChange(() => this.createWorld())
    this.gui.__proto__.constructor.toggleHide()

    // canvas element for noise debug
    this.noiseCanvas = document.createElement(`canvas`)
    this.noiseCanvas.width = 200
    this.noiseCanvas.height = 200
    this.noiseCanvas.style.position = `absolute`
    this.noiseCanvas.style.top = 0
    this.noiseCanvas.style.left = 0
    this.noiseCanvas.style.zIndex = 5
    document.body.appendChild(this.noiseCanvas)
  }

  displace(baseGeometry, noise) {
    let radius, vertex, displace

    // compute bounding sphere, get radius
    baseGeometry.computeBoundingSphere()
    radius = baseGeometry.boundingSphere.radius || 1

    // apply noise by multiplying each vertex vector with the looked up noise value
    for(let i = 0; i < baseGeometry.vertices.length; i++) {
      vertex = baseGeometry.vertices[i]
      displace = noise.get3DNoise(vertex.x / radius, vertex.y / radius, vertex.z / radius)
      vertex.multiplyScalar(1 + displace)
    }

    return baseGeometry
  }



  ///////////////////////////////////////////////////////////////////////////////
  //// UPDATE & DRAW
  ///////////////////////////////////////////////////////////////////////////////

  tick() {
    this.update()
    this.draw()
  }


  update() {
    const meshes = this.scene.children.filter(child => child instanceof THREE.Mesh)
    meshes.forEach(mesh => {
      // mesh.scale.x += 0.01
      // mesh.scale.y += 0.01
      //mesh.position.x += 0.5
      mesh.rotation.z += 0.01
      //mesh.scale.z += 0.01
      //mesh.scale.set(mesh.scale.x + 0.1, mesh.scale.y + 0.1)
      mesh.position.z -= 0.01
      // if(mesh.position.z < -250)
      //   this.scene.remove(mesh)
    })
  }


  draw() {
    this.renderer.render(this.scene, this.camera)
  }



  ///////////////////////////////////////////////////////////////////////////////
  //// EVENT HANDLERS
  ///////////////////////////////////////////////////////////////////////////////

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


  handleKeyUp(event) {
    if(event.which !== 86 && event.which !== 67) return
    this.spawn()
  }


  spawn() {

    // create noise
    const noise = new FastSimplexNoise(this.config.blob)

    // create displaced geometry
    const radius = 1
    const geometry = this.displace(new THREE.IcosahedronGeometry(radius, this.config.blob.detail), noise)



    // material with vertex colors
    //
    //
    // var faceIndices = [ 'a', 'b', 'c' ]
    // var color, f, p, vertexIndex
    // for(var i = 0; i < geometry.faces.length; i++) {
    //   f  = geometry.faces[i]
    //
    //   for(var j = 0; j < 3; j++) {
    //     vertexIndex = f[faceIndices[j]]
    //     p = geometry.vertices[vertexIndex]
    //     color = new THREE.Color(0xffffff)
    //     color.setHSL((p.y / radius + 1) / 2, 1.0, 0.5 )
    //     f.vertexColors[j] = color
    //   }
    // }
    //
    // const material = new THREE.MeshPhongMaterial( { color: 0xffffff, shading: THREE.SmoothShading, vertexColors: THREE.VertexColors, shininess: 100 } )



    // material with gradient texture map
    //
    //
    var texture = new THREE.TextureLoader().load(`images/gradient0${parseInt(Math.round(Math.random() * 6))}.jpg`)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    //texture.repeat.set(5, 1)
    const material = new THREE.MeshPhongMaterial({ color: 0xffffff, map: texture, lightMap:texture, specular:0x222222, shininess: 50})

    this.mesh = new THREE.Mesh(geometry, material)
    this.mesh.position.set(0, 0, 0)
    this.scene.add(this.mesh)


    // Draw 2d noise debug
    if(this.config.debug) {
      let x, y, val
      const context = this.noiseCanvas.getContext(`2d`)
      context.fillRect(0, 0, this.noiseCanvas.width, this.noiseCanvas.height)
      for(x = 0; x < this.noiseCanvas.width / 10; x++) {
        for(y = 0; y < this.noiseCanvas.height / 10; y++) {
          val = Math.floor((noise.get2DNoise(x * 10, y * 10) + 1) / 2 * 255)
          context.fillStyle = `rgb(${val}, ${val}, ${val})`
          context.fillRect(x * 10, y * 10, 10, 10)
        }
      }
    }
  }

}


// export already created instance
export new App()
