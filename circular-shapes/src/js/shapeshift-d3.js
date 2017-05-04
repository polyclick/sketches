// libraries
import * as d3 from 'd3'

// includes
import { mergeDeep } from './utils.js'



// shapershift class
export default class Shapeshift {

  constructor(element, config) {
    this.element = element
    this.config = config

    // the default config parameters
    this.defaults = {
      anchors: 18,              // amount of anchor points
      rings: 20,                // amount of rings
      minRingScale: 0,          // minimum scale of the most inner ring compared to the outer ring (min = 0, max = 1)
      debug: false,             // show debug view
      ringstyle: {
        alphaMode: `fade-out`,      // none, fade-in, fade-out
        alphaModeMin: 0,        // the lowest possible alpha value
        strokeColor: `#000`,    // ['#1b52ff', '#0f2d8c'], //['#1b52ff', '#ff0000'], //['#1b52ff', '#0f2d8c'],    // when solid, hex as string, when gradient: array up/down color
        dashArray: ``,          // add this property to create a dotted/dashed line
        strokeWidth: 1,         // what it says
        strokeCap: `round`      // cap of strokes, useful in combination with dasharray to create dotted/dashed lines
      },
      speed: 0.01               // animation speed
    }

    // merge defaults with incoming config parameters
    this.config = mergeDeep(this.defaults, this.config)


    if(this.config.length !== undefined)
      throw new Error(`Shapeshifter: .length config parameter has been removed an thus gets ignored.`)

    if(this.config.smooth !== undefined)
      throw new Error(`Shapeshifter: .smooth config parameter has been removed an thus gets ignored.`)

    if(this.config.center !== undefined)
      throw new Error(`Shapeshifter: .center config parameter has been removed an thus gets ignored.`)

    if(this.config.animation !== undefined)
      throw new Error(`Shapeshifter: .animation config parameter has been removed an thus gets ignored.`)

    // the elapsed time
    this.time = 0

    // setup and resize once
    this.setup()
    this.resize()
  }


  // stuff we need to do only once
  setup() {

    // scene size
    this.sceneWidth = this.element.offsetWidth
    this.sceneHeight = this.element.offsetHeight

    // data arrays for rings & anchors
    this.currentData = []
    this.fromData = this.generateRandomPathData()
    this.toData = this.generateRandomPathData()

    // d3 path objects
    this.paths = []

    // curvature function
    // d3.curveLinear
    // d3.curveStepBefore
    // d3.curveStepAfter
    // d3.curveBasis
    // d3.curveBasisOpen
    // d3.curveBasisClosed
    // d3.curveBundle
    // d3.curveCardinal
    // d3.curveCardinal
    // d3.curveCardinalOpen
    // d3.curveCardinalClosed
    // d3.curveNatural
    this.curveEquation = d3.line().x(d => d[0]).y(d => d[1]).curve(d3.curveBasisClosed)

    // svg element
    this.svg = d3.select(this.element).append(`svg`)
                                      .attr(`viewBox`, `0 0 ${this.sceneWidth} ${this.sceneHeight}`)
                                      .attr(`style`, `width: 100%; height:100%`)



    //   // fade outwards
    //   if(this.config.ringstyle.alphaMode === `fade-out`)
    //     copy.strokeColor.alpha = this.config.ringstyle.alphaModeMin + (i * (1 - this.config.ringstyle.alphaModeMin) / this.config.rings)

    //   // fade inwards
    //   if(this.config.ringstyle.alphaMode === `fade-in`)
    //     copy.strokeColor.alpha = 1 - (i * (1 - this.config.ringstyle.alphaModeMin) / this.config.rings)


    // paths
    for(let i = 0; i < this.fromData.length; i++) {
      this.currentData[i] = this.fromData[i].slice(0)

      let alpha = 1
      if(this.config.ringstyle.alphaMode === `fade-out`) alpha = this.config.ringstyle.alphaModeMin + (i * (1 - this.config.ringstyle.alphaModeMin) / this.config.rings)
      if(this.config.ringstyle.alphaMode === `fade-in`) alpha = 1 - (i * (1 - this.config.ringstyle.alphaModeMin) / this.config.rings)

      this.paths.push(this.svg.append(`path`)
                        .attr(`d`, this.curveEquation(this.currentData[i]))
                        .attr(`stroke`, this.config.ringstyle.strokeColor)
                        .attr(`stroke-dasharray`, this.config.ringstyle.dashArray)
                        .attr(`stroke-width`, this.config.ringstyle.strokeWidth)
                        .attr(`stroke-linecap`, this.config.ringstyle.strokeCap)
                        .attr(`stroke-opacity`, alpha)
                        .attr(`fill`, `none`))
    }
  }



  ///////////////////////////////////////////////////////////////////////////////
  //// UPDATE & DRAW
  ///////////////////////////////////////////////////////////////////////////////

  // update loop
  update() {
    const outerRingStart = this.fromData[0],
      outerRingEnd = this.toData[0]

    let outerRing = this.currentData[0],
      progress = 0

    // add to time
    this.time += this.config.speed

    // loop over outer ring anchors and interpolate betwwen from/to data
    for(let i = 0; i < outerRing.length; i++) {
      progress = (Math.sin(this.time + i) + 1) / 2
      outerRing[i] = this.midpoint(outerRingStart[i][0], outerRingStart[i][1], outerRingEnd[i][0], outerRingEnd[i][1], progress)
    }

    // mirror inward rings to the outer ring
    this.currentData = this.mirrorOuterRingData(this.currentData)
  }


  // draw loop
  draw() {
    for(let i = 0; i < this.currentData.length; i++)
      this.paths[i].attr(`d`, this.curveEquation(this.currentData[i]))
  }



  ///////////////////////////////////////////////////////////////////////////////
  //// RESIZE
  ///////////////////////////////////////////////////////////////////////////////

  // resize the drawing
  resize() {
    this.sceneWidth = this.element.offsetWidth
    this.sceneHeight = this.element.offsetHeight
  }



  ///////////////////////////////////////////////////////////////////////////////
  //// UTILITIES
  ///////////////////////////////////////////////////////////////////////////////

  // generate a random shape data set (outer + inner rings)
  generateRandomPathData() {
    const sceneHalf = this.sceneWidth / 2,
      maxRadius = sceneHalf,
      anglePerAnchor = Math.PI * 2 / this.config.anchors

    let data = [],
      anchors = [],
      ring, anchor, radius

    // generate rings and set all rings to outer ring value (we will correct later)
    for(ring = 0; ring < this.config.rings; ring++) {
      anchors = []

      // generate random anchors
      for(let anchor = 0; anchor < this.config.anchors; anchor++) {
        radius = Math.random() * maxRadius
        anchors.push([
          sceneHalf + (Math.cos(anglePerAnchor * anchor) * radius),
          sceneHalf + (Math.sin(anglePerAnchor * anchor) * radius)
        ])
      }

      data.push(anchors)
    }

    // add inner rings by mirroring outer ring
    // and return whole data set
    return this.mirrorOuterRingData(data)
  }


  // mirrors the shape of the outer ring to
  // the inner rings till the amount of required rings is reached
  mirrorOuterRingData(data) {
    if(this.config.rings <= 1) return data

    const sceneHalf = this.sceneWidth / 2,
      outerRing = data[0],
      inwardOffsetPerRing = (1 - this.config.minRingScale) / this.config.rings

    let ring, anchor,
      outerAnchor,
      inwardOffset

    // loop over inward ring amount, then over anchors, calculate distance to center
    // replace value in data matrix
    for(ring = 1; ring < this.config.rings; ring++) {
      inwardOffset = ring * inwardOffsetPerRing

      for(anchor = 0; anchor < this.config.anchors; anchor++) {
        outerAnchor = outerRing[anchor]
        data[ring][anchor] = this.midpoint(outerAnchor[0], outerAnchor[1], sceneHalf, sceneHalf, inwardOffset)
      }
    }

    return data
  }


  // utility function to find the midpoint at a certain percentage between 2 other points
  midpoint(x0, y0, x1, y1, perc) {
    return [x0 + ((x1 - x0) * perc), y0 + ((y1 - y0) * perc)]
  }

}
