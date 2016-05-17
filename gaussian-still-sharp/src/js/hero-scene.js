import THREE from 'three'

export class HeroScene {
  constructor(canvasWidth, canvasHeight, renderer) {
    this.canvasWidth = canvasWidth
    this.canvasHeight = canvasHeight
    this.renderer = renderer

    this.clock = null
    this.camera = null
    this.scene = null

    this.letters = null

    this.startValues = [
      {                       // LETTER O
        position: {x: -1.35, y: 0.48, z: -0.36},
        rotation: {x:  0.19, y: 0.00, z:  0.00},
        scale:    {x:  0.84, y: 1.39, z:  1.00}
      }, {                    // LETTER F
        position: {x: -0.66, y: -0.84, z: 0.00},
        rotation: {x:  0.00, y:  1.09, z: 0.21},
        scale:    {x:  1.00, y:  1.00, z: 1.00}
      }, {                    // LETTER F
        position: {x:  0.44, y:  0.52, z: -1.35},
        rotation: {x: -0.09, y: -0.58, z: -0.18},
        scale:    {x:  1.00, y:  1.78, z:  1.00}
      }, {                    // LETTER F
        position: {x: 0.74, y: -1.10, z: -0.69},
        rotation: {x: 0.06, y:  0.15, z:  0.05},
        scale:    {x: 1.00, y:  1.00, z:  1.00}
      }
    ]

    this.init()
  }

  init() {

    // clock
    this.clock = new THREE.Clock()

    // camera
    this.camera = new THREE.PerspectiveCamera(70, this.canvasWidth / this.canvasHeight, 1, 1000)
    this.camera.position.z = 7.5

    // scene
    this.scene = new THREE.Scene()

    // group for letters
    this.letters = new THREE.Group()
    this.scene.add(this.letters)

    // letters
    let objects = [
      this.createLetter('o', -2.20),
      this.createLetter('f', -0.25),
      this.createLetter('f',  1.25),
      this.createLetter('f',  2.75),
    ]

    // apply start values to them
    for(let i = 0; i < objects.length; i++) {
      let object = objects[i]
      // object.position.set(this.startValues[i].position.x, this.startValues[i].position.y, this.startValues[i].position.z)
      // object.rotation.set(this.startValues[i].rotation.x, this.startValues[i].rotation.y, this.startValues[i].rotation.z)
      // object.scale.set(this.startValues[i].scale.x, this.startValues[i].scale.y, this.startValues[i].scale.z)

      this.letters.add(object)
    }
  }

  update() {
    this.letters.position.x = this.remap(Math.sin(this.clock.getElapsedTime() / 6), -1, 1, -0.35, 0.35)
    this.letters.position.y = this.remap(Math.cos(this.clock.getElapsedTime() / 2.5), -1, 1, -0.20, 0.20)
  }

  draw() {
    this.renderer.render(this.scene, this.camera)
  }

  resize(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth
    this.canvasHeight = canvasHeight

    this.camera.aspect = this.canvasWidth / this.canvasHeight
    this.camera.updateProjectionMatrix()
  }

  mousemove(mouseX, mouseY) {
    return;

    //var strength = Math.sqrt((mouseX - 0) * (mouseX - 0) + (mouseY - 0) * (mouseY - 0))
    let strength = mouseY


    if(this.letters.children && this.letters.children.length) {

      // letter O

      let letterO = this.letters.children[0]
      let valuesO = this.startValues[0]

      TweenMax.to(letterO.position, 0.5, {
        x: valuesO.position.x + ( 1.00 * strength),
        y: valuesO.position.y + (-1.00 * strength),
        z: valuesO.position.z + ( 0.15 * strength)
      })

      TweenMax.to(letterO.rotation, 0.5, {
        x: valuesO.rotation.x + (Math.PI / 6 * strength),
        y: valuesO.rotation.y + (Math.PI / 8 * strength),
        z: valuesO.rotation.z + (0.0)
      })

      let opacityStrength = this.remap(Math.abs(strength), 0, 1, 0, 2)
      TweenMax.to(letterO.children[0].material, 1.0, { opacity: Math.min(1 - opacityStrength, 1) })
      TweenMax.to(letterO.children[1].material, 1.0, { opacity: Math.min(opacityStrength, 1) })




      // first F

      let letterF1 = this.letters.children[1]
      let valuesF1 = this.startValues[1]

      TweenMax.to(letterF1.position, 0.8, {
        x: valuesF1.position.x + ( -0.30 * strength),
        y: valuesF1.position.y + (  0.00 * strength),
        z: valuesF1.position.z + ( -0.60 * strength)
      })

      TweenMax.to(letterF1.rotation, 0.8, {
        x: valuesF1.rotation.x + (0.0),
        y: valuesF1.rotation.y + (Math.PI / 9 * strength),
        z: valuesF1.rotation.z + (Math.PI / 16 * strength)
      })

      TweenMax.to(letterF1.children[0].material, 0.8, { opacity: Math.min(1 - opacityStrength, 1) })
      TweenMax.to(letterF1.children[1].material, 0.8, { opacity: Math.min(opacityStrength, 1) })



      // second F

      let letterF2 = this.letters.children[2]
      let valuesF2 = this.startValues[2]

      TweenMax.to(letterF2.position, 1.5, {
        x: valuesF2.position.x + (0.40 * strength),
        y: valuesF2.position.y + (0.60 * strength),
        z: valuesF2.position.z + (-1.8 * strength)
      })

      TweenMax.to(letterF2.rotation, 1.5, {
        x: valuesF2.rotation.x + (0.0),
        y: valuesF2.rotation.y + (0.0),
        z: valuesF2.rotation.z + (Math.PI / 9 * strength)
      })

      TweenMax.to(letterF2.children[0].material, 1.5, { opacity: Math.min(1 - opacityStrength, 1) })
      TweenMax.to(letterF2.children[1].material, 1.5, { opacity: Math.min(opacityStrength, 1) })



      // third F

      let letterF3 = this.letters.children[3]
      let valuesF3 = this.startValues[3]

      TweenMax.to(letterF3.position, 0.6, {
        x: valuesF3.position.x + (-0.3 * strength),
        y: valuesF3.position.y + (0.1 * strength),
        z: valuesF3.position.z + (1.6 * strength)
      })

      TweenMax.to(letterF3.rotation, 0.6, {
        x: valuesF3.rotation.x + (Math.PI / 8 * strength),
        y: valuesF3.rotation.y + (0.0),
        z: valuesF3.rotation.z + (Math.PI / 12 * strength)
      })

      TweenMax.to(letterF3.children[0].material, 0.5, { opacity: Math.min(1 - opacityStrength, 1) })
      TweenMax.to(letterF3.children[1].material, 0.5, { opacity: Math.min(opacityStrength, 1) })
    }
  }

  createLetter(char, xOffset) {

    let textureLoader = new THREE.TextureLoader();
    let sharpTexture = textureLoader.load('textures/letter-' + char + '-sharp.png')
    let blurTexture = textureLoader.load('textures/letter-' + char + '-blur.png')

    let geometry = new THREE.PlaneGeometry(3, 3)

    let sharpMaterial = new THREE.MeshBasicMaterial({ map: sharpTexture, side:THREE.DoubleSide, transparent: true, depthWrite: false, depthTest: false })
    let blurMaterial = new THREE.MeshBasicMaterial({ map: blurTexture, side:THREE.DoubleSide, transparent: true, depthWrite: false, depthTest: false })

    let sharpMesh = new THREE.Mesh(geometry, sharpMaterial)
    sharpMesh.position.x = xOffset

    let blurMesh = new THREE.Mesh(geometry, blurMaterial)
    blurMesh.position.x = xOffset

    let group = new THREE.Group()
    group.add(sharpMesh)
    //group.add(blurMesh)

    return group
  }

  remap(value, low1, high1, low2, high2) {
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
  }
}
