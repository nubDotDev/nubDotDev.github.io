const thicknessElem = document.getElementById("thickness");
const colorElem = document.getElementById("color");
const canvasElem = document.getElementById("canvas");
const context = canvasElem.getContext("2d");
const bounds = canvasElem.getBoundingClientRect();

let down = false;

canvasElem.onmousedown = function (e) {
  context.strokeStyle = colorElem.value;
  context.lineWidth = thicknessElem.value;
  context.beginPath();
  context.moveTo(e.clientX - bounds.left, e.clientY - bounds.top);
  down = true;
};

document.onmouseup = function (e) {
  context.closePath();
  down = false;
};

canvasElem.onmousemove = function (e) {
  if (down) {
    context.lineTo(e.clientX - bounds.left, e.clientY - bounds.top);
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