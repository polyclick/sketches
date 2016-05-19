import THREE from 'three'

import './util.js'

export class Landscape extends THREE.Object3D {
  constructor() {
    super()

    this.meshes = null

    this.color = { h:0, s:0, l:100 }  // #ffffff
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

    //this.animateToColor(1)
  }

  createMeshes(blueprint) {
    if(this.meshes && this.meshes.length) return;     // already created, return
    this.meshes = []

    // material
    let material = new THREE.MeshBasicMaterial({ color: '#864DFF' })
    //let material = new THREE.MeshLambertMaterial({ color: '#222222' })
    // let sprite = new THREE.TextureLoader().load( "textures/disc.png" );
    // let material = new THREE.PointsMaterial( { color:'#ffffff', size: 10, side: THREE.DoubleSide, sizeAttenuation: false, map: sprite, transparent: true } );


    // primary mesh
    let primary = new THREE.Mesh(blueprint.geometry, material)
    primary.position.z = -500
    primary.scale.set(2, 1.2, 1.05)
    this.add(primary)
    this.meshes.push(primary)

    // secondary mesh
    let secondary = new THREE.Mesh(blueprint.geometry, material)
    secondary.position.z = -1500
    secondary.scale.set(2, 1.2, 1.05)
    this.add(secondary)
    this.meshes.push(secondary)

    // third
    let third = new THREE.Mesh(blueprint.geometry, material)
    third.position.z = -2500
    third.scale.set(2, 1.2, 1.05)
    this.add(third)
    this.meshes.push(third)
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
    if(this.meshes && this.meshes.length) {
      _.each(this.meshes, (mesh) => {
        mesh.position.z -= 5
        //mesh.rotation.y += 0.001

        // mesh.material.color.setHSL(this.color.h / 360, this.color.s / 100, this.color.l / 100)

        if(mesh.position.z < -2500) {
          mesh.position.z = 500
        }
      })
    }
  }

  draw () {

  }
}
