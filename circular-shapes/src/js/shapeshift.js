// libraries
import paper from 'paper'

// includes
import { mergeDeep } from './utils.js'



// shapershift class
export default class Shapeshift {

  constructor(element, config) {
    this.element = element
    this.config = config

    // the default config parameters
    this.defaults = {
      anchors: 10,              // amount of anchor points
      rings: 10,                // amount of rings
      length: 1,              // 1 = full closed path, percentage of the total possible length, number < 1 = open path
      minRingScale: 0,          // minimum scale of the most inner ring compared to the outer ring (min = 0, max = 1)
      smooth: true,             // smooth the path
      debug: false,             // show debug view
      center: [0.5, 0.5],       // magnetic center, in percentages from the canvas
      ringstyle: {
        alphaMode: `none`,      // none, fade-in, fade-out
        alphaModeMin: 0,        // the lowest possible alpha value
        strokeColor: `#000`,    // ['#1b52ff', '#0f2d8c'], //['#1b52ff', '#ff0000'], //['#1b52ff', '#0f2d8c'],    // when solid, hex as string, when gradient: array up/down color
        // dashArray: [2, 4],   // add this property to create a dotted/dashed line
        strokeWidth: 1,         // what it says
        strokeCap: `round`      // cap of strokes, useful in combination with dasharray to create dotted/dashed lines
      },
      animation: {
        speed: 0.1,             // animation speed
        reposition: `random`,   // reposition all targets per interval (all), or only 1 random (random)
        interval: 750           // the interval between target changes
      }
    }

    // merge defaults with incoming config parameters
    this.config = mergeDeep(this.defaults, this.config)

    // the elapsed time
    this.time = 0

    // setup and resize once
    this.setup()
    this.resize()
  }



  // stuff we need to do only once
  setup() {
    if(this.canvas) return

    // create canvas, init paper, append to parent
    this.canvas = document.createElement(`canvas`)
    this.scope = new paper.PaperScope()
    this.scope.setup(this.canvas)
    this.element.appendChild(this.canvas)
  }



  // stuff we need to do to re-init the drawing
  init() {
    if(!this.canvas) return

    // reset drawing when initializing again
    if(this.scope) this.reset()

    // activate this scope
    this.scope.activate()

    // reset variables
    this.anchors = []
    this.targets = []

    // set the center
    this.center = new this.scope.Point(this.sceneWidth * this.config.center[0], this.sceneHeight * this.config.center[1])

    // create helper ellipse
    const helper = new this.scope.Path.Ellipse(
      new this.scope.Rectangle(new this.scope.Point(0, 0),
      new this.scope.Size(this.sceneWidth, this.sceneHeight)))
    helper.scale(0.99)

    // pick anchor config amount of points on the ellipse
    // if playRoomPerc was set, the positions are offset a bit for more randomness
    for(let i = 0; i < this.config.anchors; i++)
      this.anchors.push(helper.getPointAt(i * helper.length / this.config.anchors))

    // if path isn't closed, copy over last point to last position
    if(this.config.length < 1)
      this.anchors.push(this.anchors[0].clone())

    // calculate first targets
    this.recalculateTargets()

    // the main path
    this.path = new this.scope.Path(Object.assign({
      segments: this.targets,
      visible: false,
      closed: this.config.length >= 1
    }, this.config.ringstyle))

    // color the main path as a gradient?
    if(typeof this.config.ringstyle.strokeColor !== `string`)
      this.path.strokeColor = this.generateGradient(this.config.ringstyle.strokeColor[0], this.config.ringstyle.strokeColor[1])

    // smooth the main path?
    if(this.config.smooth)
      this.path.smooth()

    // shorten the path if open path was set
    if(this.config.length < 1)
      this.path.splitAt(this.path.length * this.config.length)

    // create the inward copy paths
    this.copies = []
    for(let i = 0; i < this.config.rings; i++) {
      var copy = this.path.clone()
      copy.visible = true
      this.copies.push(copy)
    }

    // set some debugging
    if(this.config.debug) {
      helper.selected = true
      this.path.selected = true
      new this.scope.Path.Circle({ center: this.center, radius: 3, fillColor: 'green' })
      this.targetDebugCircles = this.targets.map(target => new this.scope.Path.Circle({ center: target, radius: 3, fillColor: 'red' }))
    }

    // throw error when trying to use alpha mode in combination with a gradient
    if(typeof this.config.ringstyle.strokeColor !== `string` && this.config.ringstyle.alphaMode !== `none`)
      throw new Error(`Using alphaMode and a gradient stroke color is not supported.`)
  }



  // reset the canvas
  reset() {
    if(!this.scope) return

    // active this scope before removing stuff
    this.scope.activate()

    // remove children drawings from active layer
    this.scope.project.activeLayer.removeChildren()

    // reset vars
    this.path = null
    this.copies = null
  }



  // update loop
  update() {
    if(!this.path) return

    // recalculate new target points
    if(Date.now() > this.time + this.config.animation.interval) {
      this.time = Date.now()
      this.config.animation.reposition === `all` ? this.recalculateTargets() : this.recalculateRandomTarget()
    }

    // move path closer to target points
    this.path.segments.forEach((segment, i) => {
      const dx = this.targets[i].x - segment.point.x
      const dy = this.targets[i].y - segment.point.y
      const angle = Math.atan2(dy, dx)
      const velX = Math.cos(angle) * this.config.animation.speed
      const velY = Math.sin(angle) * this.config.animation.speed

      this.path.segments[i].point.x += velX
      this.path.segments[i].point.y += velY
    })

    // sync copies to main path
    this.copies.forEach((copy, i) => {
      copy.segments = this.path.segments
      copy.scale(1 - (i * (1 - this.config.minRingScale) / this.config.rings))

      // reapply color (fixes render bug when using gradients)
      copy.strokeColor = typeof this.config.ringstyle.strokeColor !== `string`
        ? this.generateGradient(this.config.ringstyle.strokeColor[0], this.config.ringstyle.strokeColor[1])
        : this.config.ringstyle.strokeColor

      // fade outwards
      if(this.config.ringstyle.alphaMode === `fade-out`)
        copy.strokeColor.alpha = this.config.ringstyle.alphaModeMin + (i * (1 - this.config.ringstyle.alphaModeMin) / this.config.rings)

      // fade inwards
      if(this.config.ringstyle.alphaMode === `fade-in`)
        copy.strokeColor.alpha = 1 - (i * (1 - this.config.ringstyle.alphaModeMin) / this.config.rings)
    })
  }



  // draw loop
  draw() {
    if(!this.scope) return

    this.scope.activate()
    this.scope.view.draw()
  }



  // resize the drawing
  resize() {
    if(!this.scope) return

    // update vars
    this.sceneWidth = this.element.offsetWidth
    this.sceneHeight = this.element.offsetHeight

    // resize
    this.scope.view.viewSize.width = this.sceneWidth
    this.scope.view.viewSize.height = this.sceneHeight

    // re-init the shape
    this.init()
  }



  // recalculate target positions
  recalculateTargets() {
    this.targets = this.anchors.map(anchor => this.midpoint(this.center, anchor, 0.15 + (Math.random() * 0.85)))
    if(this.config.debug) this.repositionDebugTargets()
  }



  // recalculate a random target position
  recalculateRandomTarget() {
    const randomIndex = parseInt(Math.round(Math.random() * (this.targets.length - 1)), 10)
    this.targets[randomIndex] = this.midpoint(this.center, this.anchors[randomIndex], 0.15 + (Math.random() * 0.85))
    if(this.config.debug) this.repositionDebugTargets()
  }



  // reposition the target debug circles to match their data model
  repositionDebugTargets() {
    if(!this.targetDebugCircles) return
    this.targetDebugCircles.forEach((circle, i) => {
      circle.position = this.targets[i]
    })
  }



  // utility function to find the midpoint at a certain percentage between 2 other points
  midpoint(center, anchor, perc) {
    return new this.scope.Point(center.x + (anchor.x - center.x) * perc, center.y + (anchor.y - center.y) * perc)
  }



  // utility function to generate a paperjs gradient object
  generateGradient(up, down) {
    return {
      gradient: {
        stops: [up, down]
      },
      origin: [0, 0],
      destination: [0, this.sceneHeight]
    }
  }

}
