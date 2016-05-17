import THREE from 'three'
import loadSvg from 'load-svg'
import { parse as getSvgPaths } from 'extract-svg-path'
import svgMesh3d from 'svg-mesh-3d'
import reindex from 'mesh-reindex'
import unindex from 'unindex-mesh'
import Complex from 'three-simplicial-complex'

export class Logo extends THREE.Object3D {
  constructor() {
    super()

    this.init()
  }

  init() {
    let createGeom = Complex(THREE)
    loadSvg('svg/logo.svg', (err, svg) => {
      if (err) throw err

      // grab all <path> data
      let svgPath = getSvgPaths(svg)

      // triangulate
      let complex = svgMesh3d(svgPath, {
        scale: 10,
        simplify: 0.01
        // play with this value for different aesthetic
        // randomization: 500,
      })

      // split mesh into separate triangles so no vertices are shared
      complex = reindex(unindex(complex.positions, complex.cells))

      // build a ThreeJS geometry from the mesh primitive
      let geometry = new createGeom(complex)
      let material = new THREE.MeshBasicMaterial({ color:'#ffffff', side:THREE.DoubleSide })

      // create mesh
      let mesh = new THREE.Mesh(geometry, material)
      mesh.scale.set(8, 8, 8)
      this.add(mesh)
    })
  }
}
