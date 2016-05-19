import THREE from 'three'

export class Landscape extends THREE.Object3D {
  constructor() {
    super()

    this.objects = null

    this.color = { h:0, s:0, l:100 }  // #ffffff
    this.colors = [
      { h:4, s:100, l:64 },   // #FF5449
      { h:14, s:100, l:64 },  // #FF7349
      { h:24, s:100, l:64 }   // #FF9249
    ]

    this.size = 400

    this.init()
  }

  init() {

    // start loading the meshes
    let loader = new THREE.OBJLoader()
    loader.load('models/tunnel/tunnel.obj', (object) => {
      console.log('loaded', object)
      this.createObjects(object)
    })

    //this.animateToColor(1)
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
  }

  styleMeshes(object) {

    // materials
    //let planeMaterial = new THREE.MeshNormalMaterial({side:THREE.DoubleSide, wireframe:true})
    let planeMaterial = new THREE.MeshBasicMaterial({ color: '#ffffff', wireframe:true })
    let cylinderMaterial = new THREE.MeshBasicMaterial({ color: '#333333', wireframe:true })

    // apply to each child
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {

        if(child.name === 'Plane') {
          child.material = planeMaterial
          child.rotation.z = Math.PI
          child.position.y = -50
        }

        if(child.name === 'Cylinder') {
          child.material = cylinderMaterial
        }
      }
    })
  }

  animateToColor(index) {
    TweenMax.to(this.color, 5, {
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
    if(this.objects && this.objects.length) {
      _.each(this.objects, (object) => {
        object.position.z += 1

        // object.material.color.setHSL(this.color.h / 360, this.color.s / 100, this.color.l / 100)

        if(object.position.z > this.size / 2) {
          object.position.z = -((this.size * 2) + (this.size / 2))
        }
      })
    }
  }

  draw () {

  }
}
