export class Landscape {
  constructor(scene) {
    this.scene = scene

    this.meshes = null

    this.color = { h:0, s:100, l:100 }  // #ffffff
    this.colors = [
      { h:4, s:100, l:64 },   // #FF5449
      { h:14, s:100, l:64 },  // #FF7349
      { h:24, s:100, l:64 }   // #FF9249
    ]

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

    this.animateToColor(1)
  }

  createMeshes(blueprint) {
    if(this.meshes && this.meshes.length) return;     // already created, return
    this.meshes = []

    // material
    let material = new THREE.MeshBasicMaterial({ color: '#ffffff', wireframe: true })

    // primary mesh
    let primary = new THREE.Mesh(blueprint.geometry, material)
    primary.position.z = -500
    this.scene.add(primary)
    this.meshes.push(primary)

    // secondary mesh
    let secondary = new THREE.Mesh(blueprint.geometry, material)
    secondary.position.z = -1500
    this.scene.add(secondary)
    this.meshes.push(secondary)
  }

  animateToColor(index) {
    TweenMax.to(this.color, 3, {
      h: this.colors[index].h,
      s: this.colors[index].s,
      l: this.colors[index].l,
      ease:Linear.easeNone,
      onComplete: () => {
        let next = ++index % this.colors.length
        this.animateToColor(next)
      }
    })
  }

  update() {
    let colors = [0xB13254, 0xFF5449, 0xFF7349, 0xFF9249]
    if(this.meshes && this.meshes.length) {
      _.each(this.meshes, (mesh) => {
        mesh.position.z += 2

        mesh.material.color.setHSL(this.color.h / 360, this.color.s / 100, this.color.l / 100)

        if(mesh.position.z > 500) {
          mesh.position.z = -1500
        }
      })
    }
  }

  draw () {

  }
}
