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

    this.init()
  }

  init() {

    // clock
    this.clock = new THREE.Clock()

    // camera
    this.camera = new THREE.PerspectiveCamera(70, this.canvasWidth / this.canvasHeight, 1, 1000)
    this.camera.position.z = 10

    // scene
    this.scene = new THREE.Scene()

    // create letter group with
    // two letters in it: blurred and sharp
    let letterO = this.createLetter('o', -2.2)
    let letterF1 = this.createLetter('f', -0.25)
    let letterF2 = this.createLetter('f', 1.25)
    let letterF3 = this.createLetter('f', 2.75)

    letterF1.position.z = -0.2
    letterF2.position.z = -0.1
    letterF3.position.z = -0.2

    // group for all the letters
    this.letters = new THREE.Group()
    this.letters.add(letterO)
    this.letters.add(letterF1)
    this.letters.add(letterF2)
    this.letters.add(letterF3)
    this.scene.add(this.letters)
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
    // for(let i = 0 ; i < this.letters.children.length ; i++) {
    //   TweenMax.to(this.letters.children[i].rotation, 0.5, {y: mouseX * Math.PI })
    // }
    //console.log(mouseX)
    var strength = mouseX
    let opacityStrength = this.remap(Math.abs(strength), 0, 1, 0, 2)

    if(this.letters.children[0]) {
      //console.log(0.5 * strength)



      // letter O

      TweenMax.to(this.letters.children[0].position, 1.0, {
        x: 5.0 * strength,
        y: -6.0 * strength,
        z: 4.0 * strength
      })

      TweenMax.to(this.letters.children[0].rotation, 1.0, {
        x: Math.PI / 2 * strength,
        y: Math.PI / 4 * strength,
        z: 0.0
      })

      TweenMax.to(this.letters.children[0].scale, 1.0, {
        x: 1.0,
        y: 1.0 + (strength / 2),
        z: 1.0
      })

      TweenMax.to(this.letters.children[0].children[0].material, 1.0, { opacity: Math.min(1 - opacityStrength, 1) })
      TweenMax.to(this.letters.children[0].children[1].material, 1.0, { opacity: Math.min(opacityStrength, 1) })




      // first F

      TweenMax.to(this.letters.children[1].position, 0.8, {
        x: -2.0 * strength,
        y: 0.0 * strength,
        z: -10.0 * strength
      })

      TweenMax.to(this.letters.children[1].rotation, 0.8, {
        x: 0.0,
        y: Math.PI / 2 * strength,
        z: Math.PI / 6 * strength
      })

      TweenMax.to(this.letters.children[1].scale, 0.8, {
        x: 1.0 + (strength / 0.3),
        y: 1.0,
        z: 1.0
      })

      TweenMax.to(this.letters.children[1].children[0].material, 0.8, { opacity: Math.min(1 - opacityStrength, 1) })
      TweenMax.to(this.letters.children[1].children[1].material, 0.8, { opacity: Math.min(opacityStrength, 1) })



      // second F

      TweenMax.to(this.letters.children[2].position, 1.5, {
        x: 4.0 * strength,
        y: 6.0 * strength,
        z: 0.5 * strength
      })

      TweenMax.to(this.letters.children[2].rotation, 1.5, {
        x: 0.0,
        y: 0.0,
        z: Math.PI / 6 * strength
      })

      TweenMax.to(this.letters.children[2].scale, 1.5, {
        x: 1.0 + (strength / 0.3),
        y: 1.0 + (strength * 2.0),
        z: 1.0
      })

      TweenMax.to(this.letters.children[2].children[0].material, 1.5, { opacity: Math.min(1 - opacityStrength, 1) })
      TweenMax.to(this.letters.children[2].children[1].material, 1.5, { opacity: Math.min(opacityStrength, 1) })



      // third F

      TweenMax.to(this.letters.children[3].position, 0.5, {
        x: -3.0 * strength,
        y: 1.0 * strength,
        z: -6.0 * strength
      })

      TweenMax.to(this.letters.children[3].rotation, 0.5, {
        x: Math.PI / 3 * strength,
        y: 0.0,
        z: Math.PI / 2 * strength
      })

      TweenMax.to(this.letters.children[3].scale, 0.5, {
        x: 1.0,
        y: 1.0 + (strength * 0.3),
        z: 1.0
      })

      TweenMax.to(this.letters.children[3].children[0].material, 0.5, { opacity: Math.min(1 - opacityStrength, 1) })
      TweenMax.to(this.letters.children[3].children[1].material, 0.5, { opacity: Math.min(opacityStrength, 1) })
    }
  }

  createLetter(char, xOffset) {

    let textureLoader = new THREE.TextureLoader();
    let sharpTexture = textureLoader.load('textures/letter-' + char + '-sharp.png')
    let blurTexture = textureLoader.load('textures/letter-' + char + '-blur.png')

    let geometry = new THREE.PlaneGeometry(3, 3)

    let sharpMaterial = new THREE.MeshBasicMaterial({ map: sharpTexture, side:THREE.DoubleSide, transparent: true })
    let blurMaterial = new THREE.MeshBasicMaterial({ map: blurTexture, side:THREE.DoubleSide, transparent: true })

    let sharpMesh = new THREE.Mesh(geometry, sharpMaterial)
    sharpMesh.position.x = xOffset

    let blurMesh = new THREE.Mesh(geometry, blurMaterial)
    blurMesh.position.x = xOffset

    let group = new THREE.Group()
    group.add(sharpMesh)
    group.add(blurMesh)

    return group
  }

  remap(value, low1, high1, low2, high2) {
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
  }
}
