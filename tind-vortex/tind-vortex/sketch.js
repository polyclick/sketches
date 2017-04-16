
let tickness = minTickness
let numRings = 21
let minInnerRadius = 55
let offsetRadius = 3
let layers = []
let blendSelect
let colorSelect

let blendModes = []
let colorOrders = []

let color1 = `#4F157B` //`#1A9FF9` //`#8b28b4`
let color2 = `#486BFF` //`#258056` //`#ffd907`
let color3 = `#63FF9F` //`#0C3351` //`#ff079f`

function setup() {
  createCanvas(1000, 1000)

  layers = [color1, color2, color3]

  blendModes = [
    [`DARKEST`, DARKEST],
    [`MULTIPLY`, MULTIPLY],
    [`OVERLAY`, OVERLAY],
    [`HARD_LIGHT`, HARD_LIGHT],
    [`DIFFERENCE`, DIFFERENCE],
    [`EXCLUSION`, EXCLUSION],
    [`NORMAL`, BLEND]
  ]

  colorOrders = [
    `A - B - C`,
    `A - C - B`,
    `B - A - C`,
    `B - C - A`,
    `C - A - B`,
    `C - B - A`
  ]

  blendSelect = createSelect()
  blendSelect.position(10, 10)
  blendModes.forEach(mode => blendSelect.option(mode[0]))
  blendSelect.changed(blendModeSelected)

  colorSelect = createSelect()
  colorSelect.position(10, 50)
  colorOrders.forEach(colorOrder => colorSelect.option(colorOrder))
  colorSelect.changed(colorOrderSelected)
}

function draw() {
  background(255)

  let offsetAngle = 0
  for(let i = 0; i < layers.length; i++) {
    const g = createGraphics(width, height)

    let x = width  / 2 - (Math.sin(offsetAngle) * offsetRadius)
    let y = height / 2 - (Math.cos(offsetAngle) * offsetRadius)

    let rotation = -Math.PI / 5 + (i * Math.PI / 2)
    let radius = minInnerRadius


    for(let j = 0; j < numRings; j++) {
      const ring = new Ring(x, y, -rotation, radius, layers[i])
      ring.draw(g)

      rotation += 0.26
      radius += ((height / 2) - minInnerRadius) / numRings
    }

    if(i > 0) {
      const selected = blendModes.find(blendMode => blendSelect.value() === blendMode[0])
      blendMode(selected[1])
    }

    offsetAngle += (2 * Math.PI) / layers.length
    image(g, 0, 0)

  }
  noLoop()
}

function blendModeSelected() {
  var item = blendSelect.value()
  blendMode(BLEND)
  background(255)
  draw()
}

function colorOrderSelected() {
  var item = colorSelect.value()

  layers = item.split(` - `).map((color) => {
    if(color === `A`) return color1
    if(color === `B`) return color2
    if(color === `C`) return color3
  })

  blendMode(BLEND)
  background(255)
  draw()
}