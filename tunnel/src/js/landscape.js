import THREE from 'three'

export class Landscape extends THREE.Object3D {
  constructor() {
    super()

    this.objects = null
    this.size = 400

    this.init()
  }

  init() {

    // start loading the meshes
    let loader = new THREE.OBJLoader()
    loader.load('models/tunnel/tunnel.obj', (object) => {
      this.createObjects(object)
    })
  }

  createObjects(blueprint) {
    if(this.objects && this.objects.length) return;     // already created, return
    this.objects = []

    // first style each individual mesh, then clone into copies
    this.styleMeshes(blueprint)

    // primary mesh
    let primary = blueprint.clone()
    primary.position.z = -this.size / 2
    this.add(primary)
    this.objects.push(primary)

    // secondary mesh
    let secondary = blueprint.clone()
    secondary.position.z = -(this.size + (this.size / 2))
    this.add(secondary)
    this.objects.push(secondary)

    // third mesh
    let third = blueprint.clone()
    third.position.z = -((this.size * 2) + (this.size / 2))
    this.add(third)
    this.objects.push(third)

    // fourth mesh
    let fourth = blueprint.clone()
    fourth.position.z = -((this.size * 3) + (this.size / 2))
    this.add(fourth)
    this.objects.push(fourth)
  }

  styleMeshes(object) {

    // materials
    let planeMaterial = new THREE.MeshBasicMaterial({ color: '#ffffff', wireframe:true })
    let cylinderMaterial = new THREE.MeshBasicMaterial({ color: '#333333', wireframeLinewidth:3, wireframe:true })

    // apply to each child
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {

        if(child.name === 'Plane') {
          child.material = planeMaterial
          child.rotation.y = Math.PI
          child.position.y = 3
        }

        if(child.name === 'Cylinder') {
          child.material = cylinderMaterial
        }
      }
    })
  }

  update() {
    if(this.objects && this.objects.length) {
      _.each(this.objects, (object) => {
        object.position.z += 2
        if(object.position.z > this.size / 2) {
          object.position.z = -((this.size * 3) + (this.size / 2))
        }
      })
    }
  }

  draw () {

  }
}
