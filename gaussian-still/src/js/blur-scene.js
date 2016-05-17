import _ from 'lodash'
import THREE from 'three'

export class BlurScene {
  constructor(canvasWidth, canvasHeight, renderer, colors) {
    this.canvasWidth = canvasWidth
    this.canvasHeight = canvasHeight
    this.renderer = renderer

    this.camera = null
    this.scene = null
    this.meshes = []

    this.colors = colors

    this.init()
  }

  init() {


    // todo
    // do we really need a perspective cam?
    // sort objects still needed?
    // do we really need a light + mesh phong material?
    // -> all these could up performance

    // camera
    this.camera = new THREE.OrthographicCamera( this.canvasWidth / - 2, this.canvasWidth / 2, this.canvasHeight / 2, this.canvasHeight / - 2, 1, 5 );

    // scene
    this.scene = new THREE.Scene()

    // random meshes with colors
    for (let i = 0; i < 30; i++) {
      let colorIndex = i % this.colors.length
      let x = (Math.random() * this.canvasWidth * 2) - (this.canvasWidth)
      let y = (Math.random() * this.canvasHeight * 2) - (this.canvasHeight)
      let rotation = Math.random() * Math.PI * 2
      let scale = (0.25 + (Math.random() * 1.25)) * 10

      let mesh = this.createMeshWithShape(colorIndex, x, y, rotation, scale)
      this.meshes.push(mesh)
      this.scene.add(this.meshes[i])

      this.animateMesh(i, 0.5)
    }
  }

  update() {

  }

  updateColor(index, color) {
    this.colors[index] = color
    this.updateMaterials()
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

  animateMesh(index) {
    let x = (Math.random() * this.canvasWidth * 2) - (this.canvasWidth)
    let y = (Math.random() * this.canvasHeight * 2) - (this.canvasHeight)

    TweenMax.to(this.meshes[index].position, 20 + (Math.random() * 15), {
      x: x,
      y: y,
      ease: Linear.easeNone,
      onComplete: () => {
        this.animateMesh(index)
      }
    })
  }

  updateMaterials() {
    for(var i = 0; i < this.meshes.length; i++) {
      let mesh = this.meshes[i]
      mesh.material.color.set(this.colors[mesh.material.indexTag])
    }
  }

  mapRange(value, low1, high1, low2, high2) {
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
  }

  createMeshWithShape(colorIndex, x, y, r, s) {
    let shape = this.createRandomShape()
    let geometry = new THREE.ShapeGeometry(shape)
    let material = new THREE.MeshBasicMaterial({ color: this.colors[colorIndex] })
    material.indexTag = colorIndex  // tag this material as being colored by color index

    let mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(x, y, -1)
    mesh.rotation.set(0, 0, r)
    mesh.scale.set(s, s, s)

    return mesh
  }

  createRandomShape() {
    let shapeCreationFunctions = [
      this.createTriangleShape,
      this.createSquareShape,
      this.createRectangleShape,
      this.createCircleShape,
      this.createFishShape
    ]

    let createFunction = shapeCreationFunctions[Math.floor(Math.random() * shapeCreationFunctions.length)]
    return createFunction()
  }

  createTriangleShape() {
    let triangleShape = new THREE.Shape()
    triangleShape.moveTo(80, 20)
    triangleShape.lineTo(40, 80)
    triangleShape.lineTo(120, 80)
    triangleShape.lineTo(80, 20)

    return triangleShape
  }

  createSquareShape() {
    let sqLength = 80

    let squareShape = new THREE.Shape()
    squareShape.moveTo(0, 0)
    squareShape.lineTo(0, sqLength)
    squareShape.lineTo(sqLength, sqLength)
    squareShape.lineTo(sqLength, 0)
    squareShape.lineTo(0, 0)

    return squareShape
  }

  createRectangleShape() {
    let rectLength = 120, rectWidth = 40

    let rectShape = new THREE.Shape()
    rectShape.moveTo(0,0)
    rectShape.lineTo(0, rectWidth)
    rectShape.lineTo(rectLength, rectWidth)
    rectShape.lineTo(rectLength, 0)
    rectShape.lineTo(0, 0)

    return rectShape
  }

  createCircleShape() {
    let circleRadius = 40

    let circleShape = new THREE.Shape()
    circleShape.moveTo(0, circleRadius)
    circleShape.quadraticCurveTo(circleRadius, circleRadius, circleRadius, 0)
    circleShape.quadraticCurveTo(circleRadius, -circleRadius, 0, -circleRadius)
    circleShape.quadraticCurveTo(-circleRadius, -circleRadius, -circleRadius, 0)
    circleShape.quadraticCurveTo(-circleRadius, circleRadius, 0, circleRadius)

    return circleShape
  }

  createFishShape() {
    let x = 0, y = 0

    let fishShape = new THREE.Shape()
    fishShape.moveTo(x,y)
    fishShape.quadraticCurveTo(x + 50, y - 80, x + 90, y - 10)
    fishShape.quadraticCurveTo(x + 100, y - 10, x + 115, y - 40)
    fishShape.quadraticCurveTo(x + 115, y, x + 115, y + 40)
    fishShape.quadraticCurveTo(x + 100, y + 10, x + 90, y + 10)
    fishShape.quadraticCurveTo(x + 50, y + 80, x, y)

    return fishShape
  }
}
