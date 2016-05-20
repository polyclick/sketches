import THREE from 'three'

export class Landscape extends THREE.Object3D {
  constructor() {
    super()

    this.meshes = null

    this.init()
  }

  init() {

    // start loading the meshes
    let loader = new THREE.OBJLoader()
    loader.load('models/landscape/landscape.obj', (object) => {
      object.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          this.createMeshes(child)
        }
      })
    })
  }

  createMeshes(blueprint) {
    if(this.meshes && this.meshes.length) return;     // already created, return
    this.meshes = []

    // material
    let material = new THREE.MeshLambertMaterial({ color: '#222222' })

    // primary mesh
    let primary = new THREE.Mesh(blueprint.geometry, material)
    primary.position.z = -500
    primary.scale.set(1, 1, 1.01)
    this.add(primary)
    this.meshes.push(primary)

    // secondary mesh
    let secondary = new THREE.Mesh(blueprint.geometry, material)
    secondary.position.z = -1500
    secondary.scale.set(1, 1, 1.01)
    this.add(secondary)
    this.meshes.push(secondary)
  }

  update() {
    if(this.meshes && this.meshes.length) {
      _.each(this.meshes, (mesh) => {
        mesh.position.z += 2
        if(mesh.position.z > 500) {
          mesh.position.z = -1500
        }
      })
    }
  }

  draw () {

  }
}
