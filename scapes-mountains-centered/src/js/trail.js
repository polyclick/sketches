import THREE from 'three'

export class Trail extends THREE.Object3D {
  constructor(parent, clock, landscape) {
    super()

    this.parent = parent
    this.clock = clock
    this.landscape = landscape

    this.RAY_TOP_OFFSET = 200
    this.RAY_DOWN_VECTOR = new THREE.Vector3(0, -1, -0.25)
    this.MAX_HISTORY_POINTS = 50

    this.debug = false

    this.tail = null

    this.raycaster = new THREE.Raycaster()
    this.positionHistory = []
    this.timeSinceLastPositionMeasure = 0

    this.init()
    this.reset()
  }

  init() {

    // trail head
    let geometry = new THREE.SphereGeometry(3, 16, 16)
    let material = new THREE.MeshBasicMaterial({ color: '#ffffff' })
    let mesh = new THREE.Mesh(geometry, material)
    //this.add(mesh)

    // tail mesh (add to parent so the tail doesn't move up and down in its enterity)
    let tailGeometry = new THREE.Geometry()
    for(let i = 0; i < this.MAX_HISTORY_POINTS; i++) tailGeometry.vertices.push(new THREE.Vector3(0, 0, 500))
    let tailMaterial = new THREE.LineBasicMaterial({ color: '#ffffff', linewidth: 8, side:THREE.DoubleSide })
    this.tail = new THREE.Line(tailGeometry, tailMaterial)
    this.parent.add(this.tail)

    // ray debugging
    if(this.debug) {
      let rayGeometry = new THREE.Geometry()
      rayGeometry.vertices.push(new THREE.Vector3(0, this.RAY_TOP_OFFSET, 0))
      rayGeometry.vertices.push(this.RAY_DOWN_VECTOR.clone().multiplyScalar(200))
      let rayMaterial = new THREE.LineBasicMaterial({ color: '#ff0000', linewidth: 2})
      let rayLine = new THREE.Line(rayGeometry, rayMaterial)
      this.add(rayLine)
    }
  }

  reset() {

    // position
    this.position.x = (Math.random() * 800) - 400
    this.position.y = this.landscape.position.y
    this.position.z = 0

    // tail formation
    for(let i = 0; i < this.tail.geometry.length; i++)
      tailGeometry.vertices[i].set(this.position.x, this.position.y, this.position.z)

    // random color
    //let colors = [0xB13254, 0xFF5449, 0xFF7349, 0xFF9249, 0xB94CFF, 0xFFE754]
    let colors = [0x111111, 0x222222, 0x333333, 0x444444, 0xffffff]
    let color = colors[Math.round(Math.random() * (colors.length - 1))]
    this.tail.material.color.set(color)
  }

  update() {

    // just a default to fall back onto (when we don't detect intersection)
    let targetPosition = -200

    // update our ray
    let rayPosition = new THREE.Vector3(this.position.x, this.position.y + this.RAY_TOP_OFFSET, this.position.z)
    this.raycaster.set(rayPosition, this.RAY_DOWN_VECTOR)

    // check intersects with landscape (recursively!)
    let intersects = this.raycaster.intersectObject(this.landscape, true)
    if(intersects.length) {
      let intersectionPoint = intersects[0].point   // in world coords !
      targetPosition = intersectionPoint.y + 50.0;  // add a bit offset
    }

    // gently move toward target y position & always move forward
    this.position.y = this.position.y + (targetPosition - this.position.y) * 0.15
    this.position.z -= 2

    // reset position when at the end
    if(this.position.z < -1000) {
      this.reset()
    }

    // add last position to the beginning of the array
    // and keep the whole array capped to the maximum
    this.positionHistory.unshift(this.position.y)
    this.positionHistory = this.positionHistory.slice(0, this.MAX_HISTORY_POINTS)

    for(let i = 0; i < this.positionHistory.length ; i++) {
      if(this.tail) {
        this.tail.geometry.vertices[i].set(this.position.x, this.positionHistory[i], this.position.z + (i * 5))
        this.tail.geometry.verticesNeedUpdate = true
      }
    }
  }
}
