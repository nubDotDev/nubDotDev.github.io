// TODO figure out scoping, especially with getting elements
const SQRT3 = Math.sqrt(3);

var xSize, ySize, zSize, sideLength, thickness, cellShape, algorithm, canvas, context;
var downloadEl = document.getElementById("download");

function Cell(x, y, z, wallCount) {
  this.x = x;
  this.y = y;
  this.z = z;
  this.wallCount = wallCount;
  this.walls = [];

  for (i = 0; i < wallCount; i++) {
    this.walls[i] = false;
  }

  this.getTranslations = function () {
    throw Error("getTranslations not implemented");
  }

  this.getOpposite = function (direction) {
    return (parseInt(direction) + (this.wallCount / 2)) % this.wallCount;
  }

  this.getWallByDirection = function (direction) {
    return direction;
  }

  this.draw = function (drawData) {
    var [centerX, centerY, angle] = drawData;
    var radius = sideLength / Math.sin(Math.PI / this.wallCount) / 2;
    context.moveTo(centerX + Math.cos(angle) * radius, centerY - Math.sin(angle) * radius);
    for (let i = 0; i < this.wallCount; i++) {
      angle -= Math.PI * 2 / this.wallCount;
      if (!this.walls[i]) {
        context.lineTo(centerX + Math.cos(angle) * radius, centerY - Math.sin(angle) * radius);
      } else {
        context.moveTo(centerX + Math.cos(angle) * radius, centerY - Math.sin(angle) * radius);
      }
    }
  }
}

function QuadCell(x, z) {
  Cell.call(this, x, 0, z, 4);

  this.getTranslations = function () {
    return QuadCell.translations;
  }
}

QuadCell.translations = {
  0: [1, 0, 0],
  1: [0, 0, 1],
  2: [-1, 0, 0],
  3: [0, 0, -1]
}

function BottomHexCell(x, z) {
  Cell.call(this, x, 0, z, 6);

  this.getTranslations = function () {
    return BottomHexCell.translations;
  }
}

BottomHexCell.translations = {
  0: [1, 0, 1],
  1: [0, 0, 1],
  2: [-1, 0, 1],
  3: [-1, 0, 0],
  4: [0, 0, -1],
  5: [1, 0, 0]
}

function TopHexCell(x, z) {
  Cell.call(this, x, 0, z, 6);

  this.getTranslations = function () {
    return TopHexCell.translations;
  }
}

TopHexCell.translations = {
  0: [1, 0, 0],
  1: [0, 0, 1],
  2: [-1, 0, 0],
  3: [-1, 0, -1],
  4: [0, 0, -1],
  5: [1, 0, -1]
}

function getTriOpposite(direction) {
  return -1 * (parseInt(direction) - 1) + 1;
}

function UpwardTriCell(x, z) {
  Cell.call(this, x, 0, z, 3);

  this.getTranslations = function () {
    return UpwardTriCell.translations;
  }

  this.getOpposite = getTriOpposite;
}

UpwardTriCell.translations = {
  0: [1, 0, 0],
  1: [0, 0, 1],
  2: [-1, 0, 0]
}

function DownwardTriCell(x, z) {
  Cell.call(this, x, 0, z, 3);

  this.getTranslations = function () {
    return DownwardTriCell.translations;
  }

  this.getOpposite = getTriOpposite;

  this.getWallByDirection = function (direction) {
    switch (parseInt(direction)) {
      case 0:
        return 0;
      case 1:
        return 2;
      case 2:
        return 1;
    }
  }
}

DownwardTriCell.translations = {
  0: [1, 0, 0],
  1: [0, 0, -1],
  2: [-1, 0, 0]
}

function OctCell(x, z) {
  Cell.call(this, x, 0, z, 8);

  this.getTranslations = function () {
    return OctCell.translations;
  }

  this.getOpposite = function (direction) {
    var d = parseInt(direction);
    if (d <= 3) {
      return (d + 2) % 4;
    }
    return (d - 2) % 4 + 4;
  }

  this.getWallByDirection = function (direction) {
    if (direction <= 3) {
      return direction * 2;
    }
    return (direction - 4) * 2 + 1;
  }
}

OctCell.translations = {
  0: [1, 0, 0],
  1: [0, 0, 1],
  2: [-1, 0, 0],
  3: [0, 0, -1],
  4: [1, 0, 1],
  5: [-1, 0, 1],
  6: [-1, 0, -1],
  7: [1, 0, -1]
}

function CubeCell(x, y, z) {
  Cell.call(this, x, y, z, 6);

  this.getTranslations = function () {
    return CubeCell.translations;
  }

  this.getWallByDirection = function (direction) {
    switch (parseInt(direction)) {
      case 0:
        return 0;
      case 1:
        return 4;
      case 2:
        return 1;
      case 3:
        return 2;
      case 4:
        return 5;
      case 5:
        return 3;
    }
  }

  this.draw = function (drawData) {
    var [centerX, centerY, angle] = drawData;
    var radius = sideLength / Math.sin(Math.PI / 4) / 2;
    context.moveTo(centerX + Math.cos(angle) * radius, centerY - Math.sin(angle) * radius);
    for (let i = 0; i < 4; i++) {
      angle -= Math.PI / 2;
      if (!this.walls[i]) {
        context.lineTo(centerX + Math.cos(angle) * radius, centerY - Math.sin(angle) * radius);
      } else {
        context.moveTo(centerX + Math.cos(angle) * radius, centerY - Math.sin(angle) * radius);
      }
    }
    if (this.walls[4]) {
      context.moveTo(centerX + sideLength * 3 / 8, centerY - sideLength / 8);
      context.lineTo(centerX, centerY - sideLength * 3 / 8);
      context.lineTo(centerX - sideLength * 3 / 8, centerY - sideLength / 8);
    }
    if (this.walls[5]) {
      context.moveTo(centerX + sideLength * 3 / 8, centerY + sideLength / 8);
      context.lineTo(centerX, centerY + sideLength * 3 / 8);
      context.lineTo(centerX - sideLength * 3 / 8, centerY + sideLength / 8);
    }
  }
}

CubeCell.translations = {
  0: [1, 0, 0],
  1: [0, 1, 0],
  2: [0, 0, 1],
  3: [-1, 0, 0],
  4: [0, -1, 0],
  5: [0, 0, -1]
}

function DisjointSet() {
  this.universe = new WeakMap();

  this.addSet = function (set) {
    this.universe.set(set, set);
  }

  this.find = function (set) {
    if (set == this.universe.get(set)) {
      return set;
    }
    this.universe.set(set, this.find(this.universe.get(set)));
    return this.universe.get(set);
  }

  this.union = function (set1, set2) {
    root1 = this.find(set1);
    root2 = this.find(set2);
    if (root1 != root2) {
      this.universe.set(root2, root1);
      return true;
    }
    return false;
  }
}

function getNeighbor(cell, translation, grid) {
  return grid[(cell.x + translation[0]) + "," + (cell.y + translation[1]) + "," + (cell.z + translation[2])];
}

function getNeighbors(cell, grid, visited) {
  var neighbors = [];
  for (let [direction, translation] of Object.entries(cell.getTranslations())) {
    var neighbor = getNeighbor(cell, translation, grid);
    if (neighbor != null && (visited == null || !visited.has(neighbor))) {
      neighbors.push([neighbor, direction]);
    }
  }
  return neighbors;
}

function aldousBroder(grid) {
  var values = Object.values(grid);
  var current = values[Math.floor(Math.random() * values.length)];
  var visited = new Set();
  visited.add(current);
  while (visited.size < values.length) {
    var neighbors = getNeighbors(current, grid);
    var [next, direction] = neighbors[Math.floor(Math.random() * neighbors.length)];
    if (!visited.has(next)) {
      current.walls[current.getWallByDirection(direction)] = true;
      next.walls[next.getWallByDirection(next.getOpposite(direction))] = true;
      visited.add(next);
    }
    current = next;
  }
}

// TODO optimize (maybe make walls a set)
function kruskal(grid) {
  var disjointSet = new DisjointSet();
  var walls = [];
  for (let cell of Object.values(grid)) {
    disjointSet.addSet(cell);
    for (let direction of Object.keys(cell.getTranslations())) {
      walls.push([cell, direction]);
    }
  }
  while (walls.length > 0) {
    var random = Math.floor(Math.random() * walls.length);
    var [cell, direction] = walls[random];
    walls.splice(random, 1);
    var other = getNeighbor(cell, cell.getTranslations()[direction], grid);
    if (other != null) {
      if (disjointSet.union(cell, other)) {
        cell.walls[cell.getWallByDirection(direction)] = true;
        other.walls[other.getWallByDirection(other.getOpposite(direction))] = true;
      }
    }
  }
}

function recursiveBacktracker(grid) {
  var values = Object.values(grid);
  var current = values[Math.floor(Math.random() * values.length)];
  var visited = new Set();
  visited.add(current);
  var backtrack = [];
  while (visited.size < values.length) {
    var neighbors = getNeighbors(current, grid, visited);
    if (neighbors.length > 0) {
      var [next, direction] = neighbors[Math.floor(Math.random() * neighbors.length)];
      current.walls[current.getWallByDirection(direction)] = true;
      next.walls[next.getWallByDirection(next.getOpposite(direction))] = true;
      backtrack.push(current);
      current = next;
      visited.add(current);
    } else {
      current = backtrack.pop();
    }
  }
}

function wilson(grid) {
  var values = Object.values(grid);
  var notMaze = new Set(values);
  notMaze.delete(values[Math.floor(Math.random() * values.length)]);
  while (notMaze.size > 0) {
    var path = new WeakMap();
    var start = values[Math.floor(Math.random() * values.length)];
    var current = start;
    while (notMaze.has(current)) {
      var neighbors = getNeighbors(current, grid);
      var [next, direction] = neighbors[Math.floor(Math.random() * neighbors.length)];
      path.set(current, direction);
      current = next;
    }
    current = start;
    while (notMaze.has(current)) {
      notMaze.delete(current);
      var direction = path.get(current);
      current.walls[current.getWallByDirection(direction)] = true;
      current = getNeighbor(current, current.getTranslations()[direction], grid);
      current.walls[current.getWallByDirection(current.getOpposite(direction))] = true;
    }
  }
}


function generate() {
  xSize = parseInt(document.getElementById("x").value);
  ySize = parseInt(document.getElementById("y").value);
  zSize = parseInt(document.getElementById("z").value);
  sideLength = parseInt(document.getElementById("sideLength").value);
  thickness = parseInt(document.getElementById("thickness").value);
  cellShape = document.getElementById("shape").value;
  algorithm = document.getElementById("algorithm").value;
  canvas = document.getElementById("maze");
  context = canvas.getContext("2d");

  switch (cellShape) {
    case "delta":
      this.createCell = function (x, y, z) {
        if (x % 2 == 1 ^ z % 2 == 1) {
          return new DownwardTriCell(x, z);
        }
        return new UpwardTriCell(x, z);
      }
      this.drawData = function (cell) {
        return [
          (cell.x + 1) * (sideLength * 0.5) + thickness,
          cell instanceof DownwardTriCell ? cell.z * sideLength * SQRT3 / 2 + sideLength / SQRT3 / 2 + thickness :
            (cell.z + 1) * sideLength * SQRT3 / 2 - sideLength / SQRT3 / 2 + thickness,
          cell instanceof DownwardTriCell ? Math.PI / 6 : Math.PI / 2
        ];
      }
      canvas.width = (Math.ceil(xSize / 2) + 1) * sideLength + (thickness * 2);
      canvas.height = zSize * sideLength * (SQRT3 / 2) + (thickness * 2);
      break;
    case "orthogonal":
      this.createCell = function (x, y, z) {
        return new QuadCell(x, z);
      }
      this.drawData = function (cell) {
        return [(cell.x + 0.5) * sideLength + thickness, (cell.z + 0.5) * sideLength + thickness, Math.PI / 4];
      }
      canvas.width = xSize * sideLength + (thickness * 2);
      canvas.height = zSize * sideLength + (thickness * 2);
      break;
    case "sigma":
      this.createCell = function (x, y, z) {
        if (x % 2 == 0) {
          return new BottomHexCell(x, z);
        }
        return new TopHexCell(x, z);
      }
      this.drawData = function (cell) {
        return [
          (cell.x + (2 / 3)) * (1.5 * sideLength) + thickness,
          cell instanceof BottomHexCell ? (cell.z + 1) * sideLength * SQRT3 + thickness :
            (cell.z + 0.5) * sideLength * SQRT3 + thickness,
          0
        ];
      }
      canvas.width = (xSize + 1 / 3) * sideLength * 1.5 + (thickness * 2);
      canvas.height = (zSize + 0.5) * sideLength * SQRT3 + (thickness * 2);
      break;
    case "upsilon":
      this.createCell = function (x, y, z) {
        if (x % 2 == 1 ^ z % 2 == 1) {
          return new QuadCell(x, z);
        }
        return new OctCell(x, z);
      }
      this.drawData = function (cell) {
        var offset = 0.5 * sideLength / Math.SQRT2;
        return [
          (cell.x + 0.5) * (sideLength + sideLength / Math.SQRT2) + offset + thickness,
          (cell.z + 0.5) * (sideLength + sideLength / Math.SQRT2) + offset + thickness,
          cell instanceof QuadCell ? Math.PI / 4 : Math.PI / 8
        ];
      }
      canvas.width = xSize * (sideLength + sideLength / Math.SQRT2) + (sideLength / Math.SQRT2) + (thickness * 2);
      canvas.height = zSize * (sideLength + sideLength / Math.SQRT2) + (sideLength / Math.SQRT2) + (thickness * 2);
      break;
    case "3d":
      this.createCell = function (x, y, z) {
        return new CubeCell(x, y, z);
      }
      this.drawData = function (cell) {
        return [(cell.x + 0.5) * sideLength + thickness, (cell.z + 0.5) * sideLength + cell.y * (zSize + 1) * sideLength + thickness, Math.PI / 4];
      }
      canvas.width = xSize * sideLength + (thickness * 2);
      canvas.height = ySize * (zSize * sideLength) + (ySize - 1) * sideLength + (thickness * 2);
      break;
  }

  var start = new Date().getTime();

  var grid = {};
  for (let i = 0; i < xSize; i++) {
    for (let j = 0; j < ySize; j++) {
      for (let k = 0; k < zSize; k++) {
        grid[i + "," + j + "," + k] = this.createCell(i, j, k);
      }
    }
  }

  switch (algorithm) {
    case "aldousBroder":
      aldousBroder(grid);
      break;
    case "eller":
      eller(grid);
      break;
    case "kruskal":
      kruskal(grid);
      break;
    case "recursiveBacktracker":
      recursiveBacktracker(grid);
      break;
    case "wilson":
      wilson(grid);
      break;
  }

  console.log("Generation time: " + (new Date().getTime() - start));
  start = new Date().getTime();

  context.lineWidth = thickness;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#ffffff"
  context.beginPath();
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fill();
  context.fillStyle = "#000000"

  for (let i = 0; i < xSize; i++) {
    for (let j = 0; j < ySize; j++) {
      for (let k = 0; k < zSize; k++) {
        var cell = grid[i + "," + j + "," + k];
        cell.draw(this.drawData(cell));
      }
    }
  }

  context.stroke();
  downloadEl.style.display = "block";

  console.log("Draw time: " + (new Date().getTime() - start));
}

function algorithmChange() {
  var algorithm = document.getElementById("algorithm");
  var shape = document.getElementById("shape");
  if (algorithm.value == "eller") {
    shape.value = "orthogonal";
    shape.disabled = true;
  } else {
    shape.disabled = false;
  }
}

function shapeChange() {
  var shape = document.getElementById("shape");
  var y = document.getElementById("y");
  if (shape.value == "3d") {
    y.disabled = false;
  } else {
    y.value = 1;
    y.disabled = true;
  }
}

function downloadMaze() {
  var image = canvas.toDataURL("maze/png");
  downloadEl.href = image;
}