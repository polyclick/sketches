let minTickness = 3
let maxTickness = 21

var Ring = function(centerX, centerY, rotation, radius, color) {
  this.centerX = centerX
  this.centerY = centerY
  this.rotation = rotation
  this.radius = radius
  this.color = color
}

Ring.prototype.draw = function(g) {
  g.push()

  g.smooth()
  g.noStroke()
  g.fill(this.color)
  g.translate(this.centerX, this.centerY)
  g.rotate(this.rotation)

  let tickness = minTickness
  let angle = 0

  // keep looping while the current angle is lower than 360 degrees (2PI)
  while(angle > -2 * Math.PI) {

    // draw the circle
    let x = Math.sin(angle) * this.radius
    let y = Math.cos(angle) * this.radius
    g.ellipse(x, y, tickness)

    // set thickness linear to the current angle we are on
    // so that the circle radiusses grow bigger when they near 360 degrees
    tickness = minTickness + ((-angle / (2 * Math.PI)) * (maxTickness - minTickness))

    // then, move the angle by using this thickness compared to the circle radius
    // so that, when the tickness grows, the angle gets bigger
    angle -= (tickness / 4) / this.radius
  }

  g.pop()
}