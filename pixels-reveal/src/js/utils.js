// utils

// random unique (history + steps to remember)
// distance
// color to hsl
// hsl to color

// threejs specific
// load .obj and create mesh

// distance
function distance(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2))
}

// radtodeg
function radToDeg(radians) {
  return radians * (180 / Math.PI)
}

// degtorad
function degToRad(degrees) {
  return degrees * (Math.PI / 180)
}

// frustrum size
//
// http://gamedev.stackexchange.com/a/96712/18433
// the frustrum width/height of a projected scene
// this comes in handy to know the boundries of the scene from the camera's perspective
// fov: the camera's field of view
// aspect: the width/height aspect ratio of the viewport
// distance: the distance from the object to the camera
//
// threejs example to get the screen size at the camera's position:
// frustrumSize(camera.fov, this.screenWidth / this.screenHeight, this.camera.position.z)
function frustrumSizeAtCamera(camera, viewportWidth, viewportHeight) {
  return frustrumSize(camera.fov, viewportWidth / viewportHeight, this.camera.position.z)
}
function frustrumSizeForCamera(camera, viewportWidth, viewportHeight) {
  return frustrumSize(camera.fov, viewportWidth / viewportHeight, this.camera.position.z)
}
function frustrumSize(fov, aspect, distance) {
  var frustumHeight = 2.0 * distance * Math.tan(fov * 0.5 * (Math.PI / 180))
  var frustumWidth = frustumHeight * aspect
  return {
    width: frustumWidth,
    height: frustumHeight
  }
}

// random element from array
function randomFromArray(array) {
  return array[Math.floor(Math.random() * array.length)]
}

// random number between min and max
//
// Randomly pick a number between min and max.
// When max wasn't given, the range automatically start from 0 to max,
// so randomInt(5) returns a random number between 0 and 5
function randomBetween(min, max) {
  if(!max) {
    max = min
    min = 0
  }
  return Math.random() * (max - min) + min
}

// random integer between min (included) and max (included)
//
// Randomly pick an integer between min and max.
// When max wasn't given, the range automatically start from 0 to max,
// so randomInt(5) returns a random integer between 0 and 5
function randomInt(min, max) {
  if(!max) {
    max = min
    min = 0
  }
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// random yes/no (true/false)
function randomBool() {
  return Math.random() < 0.5
}

// random from two given options
function randomSwitch(one, two) {
  if(!one || !two) throw "Can't randomly choose a value, at least one of them were invalid."
  return randomBool() ? one : two
}

// check if parameter was given, when not, return the default
function defaultParameter(parameter, defaultValue) {
  return !parameter || parameter === undefined || parameter === null ? defaultValue : parameter
}

// normalized cursor (centered)
//
// Keep the cursor between -1 and 1 in both the x and y axes
// When the cursor is Top Left of the screen the returned value is -1, -1
// When the cursor is in the Center of the screen, the returned value is 0, 0
// When the cursor is Bottom Right of the screen, the returned value is 1, 1
//
// Optionally, give width and height if you don't want the function to use the window inner width/height
function normalizeMouse(event, width, height) { return normalizeCursor(event, width, height) }
function normalizePointer(event, width, height) { return normalizeCursor(event, width, height) }
function normalizeCursor(event, width, height) {
  if(!event) throw "Couldn't normalize cursor, event was undefined"
  return {
    x: (event.clientX / defaultParameter(width, window.innerWidth)) * 2 - 1,
    y: (event.clientY / defaultParameter(height, window.innerHeight)) * 2 - 1
  }
}

// clamp the cursor (top left)
//
// Keep the cursor between 0 and 1 in both the x and y axes
// When the cursor is Top Left of the screen the returned value is 0, 0
// When the cursor is Bottom Right of the screen, the returned value is 1, 1
//
// Optionally, give width and height if you don't want the function to use the window inner width/height
function clampMouse(event, width, height) { return clampCursor(event, width, height) }
function clampPointer(event, width, height) { return clampCursor(event, width, height) }
function clampCursor(event, width, height) {
  if(!event) throw "Couldn't clamp cursor, event was undefined"
  return {
    x: (event.clientX / defaultParameter(width, window.innerWidth)),
    y: (event.clientY / defaultParameter(height, window.innerHeight))
  }
}

// remap
//
// Given a value and an input range, map the value to an output range.
// Linearly maps the given value to a new value given an input and output
// range.  Thus if value is 50% of the way between inputMin and inputMax, then
// output value will be 50% of the way between outputMin and outputMax.
function remap(value, inputMin, inputMax, outputMin, outputMax) {
  return Math.abs(inputMin - inputMax) !== 0 ?
    ((value - inputMin) / (inputMax - inputMin) * (outputMax - outputMin) + outputMin) : outputMin
}

// clamp
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}
