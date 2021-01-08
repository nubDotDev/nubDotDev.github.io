const thicknessElem = document.getElementById("thickness");
const colorElem = document.getElementById("color");
const canvasElem = document.getElementById("canvas");
const context = canvasElem.getContext("2d");

let down = false;
context.lineCap = "round";

function getMouseCoords(e) {
  const bounds = canvasElem.getBoundingClientRect();
  return [e.clientX - bounds.left, e.clientY - bounds.top];
}

canvasElem.onmousedown = function (e) {
  context.strokeStyle = colorElem.value;
  context.lineWidth = thicknessElem.value;
  context.beginPath();
  context.moveTo(...getMouseCoords(e));
  down = true;
};

document.onmouseup = function (e) {
  context.closePath();
  down = false;
};

canvasElem.onmousemove = function (e) {
  if (down) {
    context.lineTo(...getMouseCoords(e));
    context.stroke();
  }
}

function clearCanvas() {
  context.clearRect(0, 0, canvasElem.width, canvasElem.height);
  context.drawImage(mazeElem, 0, 0);
}

function downloadMaze() {
  const image = canvasElem.toDataURL("maze/png");
  document.getElementById("download").href = image;
}