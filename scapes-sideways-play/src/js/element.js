import THREE from 'three'

export class Element extends THREE.Object3D {
  constructor() {
    super()

    this.init()
  }

  init() {
    let geometry = this.createRandomGeometry()
    let material = new THREE.MeshNormalMaterial()

    let mesh = new THREE.Mesh(geometry, material)
    let scale = 0.10 + (Math.random() * 0.15)
    mesh.scale.set(scale, scale, scale)
    this.add(mesh)

    let time = 0.7 + (Math.random() * 0.7)
    if(Math.round(Math.random())) {
      TweenMax.to(mesh.rotation, time, {x: Math.PI * 2, y: Math.PI * 2, repeat:-1, ease:Linear.easeNone})
    } else {
      TweenMax.to(mesh.rotation, time, {x: Math.PI * 2, z: Math.PI * 2, repeat:-1, ease:Linear.easeNone})
    }
  }

  createRandomGeometry() {
    const count = 12
    let picked = parseInt(Math.round(Math.random() * (count - 1)), 10)

    if (picked === 0)  return new THREE.SphereGeometry(75, 20, 16)
    if (picked === 1)  return new THREE.IcosahedronGeometry(75, 1)
    if (picked === 2)  return new THREE.OctahedronGeometry(75, 2)
    if (picked === 3)  return new THREE.TetrahedronGeometry(75, 0)
    if (picked === 4)  return new THREE.PlaneGeometry(100, 100, 4, 4)
    if (picked === 5)  return new THREE.BoxGeometry(100, 100, 100, 4, 4, 4)
    if (picked === 6)  return new THREE.CircleGeometry(50, 20, 0, Math.PI * 2)
    if (picked === 7)  return new THREE.RingGeometry(10, 50, 20, 5, 0, Math.PI * 2)
    if (picked === 8)  return new THREE.CylinderGeometry(25, 75, 100, 40, 5)
    if (picked === 9)  return new THREE.TorusGeometry(50, 20, 20, 20)
    if (picked === 10) return new THREE.TorusKnotGeometry(50, 10, 50, 20)

    // return default
    var points = []
    for(var i = 0; i < 50; i++) {
      points.push( new THREE.Vector2(Math.sin(i * 0.2) * Math.sin(i * 0.1) * 15 + 50, (i - 5) * 2))
    }
    return new THREE.LatheGeometry(points, 20)
  }
}
