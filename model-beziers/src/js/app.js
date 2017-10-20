// libraries
import TweenMax from 'gsap'
import dat from 'dat-gui'

// extensions
import OrbitControls from 'three/controls/OrbitControls'
import MTLLoader from 'three/loaders/MTLLoader'
import OBJLoader from 'three/loaders/OBJLoader'


///////////////////////////////////////////////////////////////////////////////
//// APPLICATION CLASS
///////////////////////////////////////////////////////////////////////////////

class App {



  ///////////////////////////////////////////////////////////////////////////////
  //// CONSTRUCTION & DESTRUCTION
  ///////////////////////////////////////////////////////////////////////////////

  constructor() {
    this.sceneWidth = window.innerWidth
    this.sceneHeight = window.innerHeight

    this.init()
    this.handleResize()
  }



  init() {

    // gui
    this.gui = new dat.GUI()
    this.gui.closed = true

    // clock
    this.clock = new THREE.Clock()

    // renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(this.sceneWidth, this.sceneHeight)
    this.renderer.setClearColor(0xffffff, 1)
    document.body.appendChild(this.renderer.domElement)

    // scene
    this.createScene()

    // render & animation ticker
    TweenMax.ticker.fps(60)
    TweenMax.ticker.addEventListener(`tick`, () => { this.handleTick() })

    // resize
    window.addEventListener(`resize`, (e) => { this.handleResize(e) }, false)
  }



  createScene() {
    this.scene = new THREE.Scene()
    this.scene.fog = new THREE.FogExp2( 0xffffff, 0.0005)

    this.setupCameras()
    this.setupLights()
    this.setupModels()
  }



  setupCameras() {

    // default camera
    this.camera = new THREE.PerspectiveCamera(70, this.sceneWidth / this.sceneHeight, 1, 7500)
    this.camera.position.z = 600

    // default camera debug
    const camFolder = this.gui.addFolder(`Default Camera`)
    camFolder.add(this.camera, 'fov', 25, 120).onChange(() => { this.camera.updateProjectionMatrix() })
    camFolder.add(this.camera, 'zoom', 0.1, 10).onChange(() => { this.camera.updateProjectionMatrix() })
    camFolder.add(this.camera, 'near').onChange(() => { this.camera.updateProjectionMatrix() })
    camFolder.add(this.camera, 'far').onChange(() => { this.camera.updateProjectionMatrix() })
    camFolder.add(this.camera.position, 'x').name('posX').onChange(() => { this.camera.updateProjectionMatrix() })
    camFolder.add(this.camera.position, 'y').name('posY').onChange(() => { this.camera.updateProjectionMatrix() })
    camFolder.add(this.camera.position, 'z').name('posZ').onChange(() => { this.camera.updateProjectionMatrix() })
    camFolder.open()

    // controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
  }



  setupLights() {

    this.pointLight = new THREE.PointLight(0xffffff)
    this.pointLight.castShadow = true

    this.scene.add(this.pointLight)
  }



  setupModels() {
    let geometry = new THREE.SphereGeometry(100, 4, 4)
    geometry.computeBoundingBox()

    let material = new THREE.MeshNormalMaterial({ wireframe: true })

    this.mesh = new THREE.Mesh(geometry, material)
    // this.scene.add(this.mesh)


    // this.scene.add(this.bezierify(this.mesh.geometry))



    const modelRoot = './assets/models/'

    var objLoader = new OBJLoader()
    objLoader.setPath(modelRoot)

    // load object
    objLoader.load('skull.obj', (object) => {
      object.traverse((child) => {
        if(child instanceof THREE.Mesh) {
          child.material = new THREE.MeshLambertMaterial({ color: 0xeeeeee, transparent: true, opacity: 1 })
          child.castShadow = true
          TweenMax.to(child.material, 5.0, { opacity: 0, delay: 3.0 })
          this.scene.add(this.bezierify(child.geometry))
        }
      })



      this.scene.add(object)

    })

    var ground = new THREE.Mesh(
      new THREE.PlaneBufferGeometry( 10000, 10000, 1, 1 ),
      new THREE.MeshPhongMaterial( { color: 0xeeeeee, shininess: 20, side: THREE.DoubleSide } )
    )


    ground.rotation.x = - Math.PI / 2; // rotates X/Y to X/Z
    ground.position.y = -200
    ground.receiveShadow = true;
    this.scene.add( ground );
  }

  bezierify(geometry) {
    console.log(geometry)

    let geom = new THREE.Geometry()
    geom.fromBufferGeometry(geometry)

    geom.computeBoundingSphere()

    let i, j, vertA, vertB, bezier, curveGeom, curveColor, curveMat, curveObject,
      verts  = geom.vertices,
      radius = geom.boundingSphere.radius,
      center = geom.boundingSphere.center,
      result = new THREE.Group()

    let maxBeziers = 2000,
      beziersDrawn = 0,
      maxSuccessiveAttempts = 100,
      successiveAttempts = 0


    do {

      // get two random verts
      vertA = verts[parseInt(Math.random() * (verts.length - 1))]
      vertB = verts[parseInt(Math.random() * (verts.length - 1))]

      // same verts, continue but count as successive attempt
      if(vertA === vertB) {
        successiveAttempts++
        continue
      }

      // shortest distance to each other is smaller than half the radius
      // not far enough removed from each other, skip and go to next
      if(vertA.distanceTo(vertB) < radius / 2) {
        successiveAttempts++
        continue
      }

      // calculate a bezier path from the first vertex to the second
      // vertex, going through the center point
      bezier = new THREE.QuadraticBezierCurve3(vertA, center, vertB)

      // create curve geometry by getting actual x, y, z positions
      // from the bezier curve
      curveGeom = new THREE.Geometry()
      curveGeom.vertices = bezier.getPoints(20)

      // set material
      curveColor = new THREE.Color()
      curveColor.setHSL(0, 0, 0.5 + (Math.random() * 0.5))
      curveMat = new THREE.LineBasicMaterial({ color : curveColor })

      // create curve object, add to scene
      curveObject = new THREE.Line(curveGeom, curveMat)
      result.add(curveObject)

      // count
      beziersDrawn++
      successiveAttempts = 0

    } while(beziersDrawn < maxBeziers || successiveAttempts > maxSuccessiveAttempts)

    if(successiveAttempts > maxSuccessiveAttempts)
      console.error(`Broken out of loop, more than ${maxSuccessiveAttempts} successive attempts to draw a bezier, but nothign useful found`)


    return result
  }



  ///////////////////////////////////////////////////////////////////////////////
  //// UPDATE & DRAW
  ///////////////////////////////////////////////////////////////////////////////

  update() {
    const delta = this.clock.getDelta()

    if(this.controls)
      this.controls.update()

    this.pointLight.position.set(this.camera.position.x, this.camera.position.y, this.camera.position.z)

    // this.mesh.rotation.x += 0.005
    // this.mesh.rotation.y += 0.01
  }



  draw() {
    this.renderer.render(this.scene, this.camera)
  }



  ///////////////////////////////////////////////////////////////////////////////
  //// HANDLERS & UTILS
  ///////////////////////////////////////////////////////////////////////////////

  handleTick() {
    this.update()
    this.draw()
  }



  handleResize(e) {

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



///////////////////////////////////////////////////////////////////////////////
//// EXPORTS
///////////////////////////////////////////////////////////////////////////////

export const app = new App()
