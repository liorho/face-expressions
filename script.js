const video = document.getElementById('video')

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.faceExpressionNet.loadFromUri('/models')
]).then(startVideo)

function startVideo() {
  navigator.getUserMedia(
    { video: {} },
    stream => video.srcObject = stream,
    err => console.error(err)
  )
}

let lastCurrentExpression
let currentTime = new Date()

const numToPercentage = (num) => (num * 100).toFixed(2)

const getTimeDiffInSec = () => parseInt(Math.abs((new Date()).getTime() - currentTime.getTime()) / (1000) % 60)

const getCurrentExpression = (expressions) => {
  let currentExpression
  let highestProbability = 0
  for (let [expression, probability] of Object.entries(expressions)) {
    if (probability > highestProbability) {
      highestProbability = probability
      currentExpression = expression
    }
  }
  return currentExpression
}

video.addEventListener('play', () => {
  const canvas = faceapi.createCanvasFromMedia(video)
  document.body.append(canvas)
  const displaySize = { width: video.width, height: video.height }
  faceapi.matchDimensions(canvas, displaySize)
  setInterval(async () => {
    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions()
    const resizedDetections = faceapi.resizeResults(detections, displaySize)
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    faceapi.draw.drawDetections(canvas, resizedDetections)
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
    faceapi.draw.drawFaceExpressions(canvas, resizedDetections)

    const expressions = detections[0]?.expressions
    let currentExpression = expressions ? getCurrentExpression(expressions) : null
    if (currentExpression !== lastCurrentExpression && expressions) {
      const timeDiffInSec = getTimeDiffInSec()
      currentTime = new Date()
      console.log(`You are now ${currentExpression} after being ${lastCurrentExpression} for ${timeDiffInSec} seconds `)
      lastCurrentExpression = currentExpression
    }

  }, 1000)
})