
let numRings = 21
let minInnerRadius = 55
let offsetRadius = 3
let layers = []

let colorOrders = []
let config = {
  bottom: `#4F157B`,  //`#1A9FF9` //`#8b28b4`
  mid: `#486BFF`,     //`#258056` //`#ffd907`
  top: `#63FF9F`,      //`#0C3351` //`#ff079f`
  blendMode: null,
  colorOrder: `bottom - mid - top`
}

function setup() {
  createCanvas(window.innerWidth * 0.75, window.innerWidth * 0.75)

  layers = [config.bottom, config.mid, config.top]
  config.blendMode = DARKEST

  const blendModes = {
    'Darkest': DARKEST,
    'Multiply': MULTIPLY,
    'Overlay': OVERLAY,
    'Hard light': HARD_LIGHT,
    'Difference': DIFFERENCE,
    'Exclusion': EXCLUSION,
    'Normal': BLEND
  }

  const colorOrders = [
    `bottom - mid - top`,
    `bottom - top - mid`,
    `mid - bottom - top`,
    `mid - top - bottom`,
    `top - bottom - mid`,
    `top - mid - bottom`
  ]

  const gui = new dat.GUI()
  gui.__proto__.constructor.toggleHide()
  gui.addColor(config, `bottom`).onFinishChange((value) => { configureAndDraw() })
  gui.addColor(config, `mid`).onFinishChange((value) => { configureAndDraw() })
  gui.addColor(config, `top`).onFinishChange((value) => { configureAndDraw() })
  gui.add(config, `blendMode`, blendModes).onFinishChange((value) => { configureAndDraw() })
  gui.add(config, `colorOrder`, colorOrders).onFinishChange((value) => { configureAndDraw() })
  gui.add({save: () => saveCanvas()}, `save`)
}

function configureAndDraw() {
  layers = config.colorOrder.split(` - `).map((color) => {
    if(color === `bottom`) return config.bottom
    if(color === `mid`) return config.mid
    if(color === `top`) return config.top
  })

  draw()
}

function draw() {
  blendMode(BLEND)
  background(255)

  let offsetAngle = 0
  for(let i = 0; i < layers.length; i++) {
    const g = createGraphics(width, height)

    let x = width  / 2 - (Math.sin(offsetAngle) * offsetRadius)
    let y = height / 2 - (Math.cos(offsetAngle) * offsetRadius)

    let rotation = -Math.PI / 5 + (i * Math.PI / 2)
    let radius = minInnerRadius

    // draw the rings for this layer
    for(let j = 0; j < numRings; j++) {
      const ring = new Ring(x, y, -rotation, radius, layers[i])
      ring.draw(g)

      rotation += 0.26
      radius += ((height / 2) - minInnerRadius) / numRings
    }

    // blend layers AFTER first one
    if(i > 0) blendMode(config.blendMode)

    // draw layer
    image(g, 0, 0)

    // set offset angle for next layer
    offsetAngle += (2 * Math.PI) / layers.length
  }

  noLoop()
}