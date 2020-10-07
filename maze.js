const SQRT3 = Math.sqrt(3);

var xSize, ySize, sideLength, thickness, cellShape, algorithm, canvas, context;

function Cell(x, y, wallCount) {
  this.x = x;
  this.y = y;
  this.wallCount = wallCount
  this.walls = []
  for (i = 0; i < wallCount; i++) {
    this.walls[i] = false;
  }

  this.getTranslations = function () {
    throw Error("getTranslation not implemented");
  }

  this.getOpposite = function (direction) {
    return (parseInt(direction) + (this.wallCount / 2)) % this.wallCount;
  }

  this.getWallByDirection = function (direction) {
    return direction;
  }
}

function QuadCell(x, y) {
  Cell.call(this, x, y, 4);

  this.getTranslations = function () {
    return QuadCell.translations;
  }
}

QuadCell.translations = {
  0: [1, 0],
  1: [0, 1],
  2: [-1, 0],
  3: [0, -1]
}

function BottomHexCell(x, y) {
  Cell.call(this, x, y, 6);

  this.getTranslations = function () {
    return BottomHexCell.translations;
  }
}

BottomHexCell.translations = {
  0: [1, 1],
  1: [0, 1],
  2: [-1, 1],
  3: [-1, 0],
  4: [0, -1],
  5: [1, 0]
}

function TopHexCell(x, y) {
  Cell.call(this, x, y, 6);

  this.getTranslations = function () {
    return TopHexCell.translations;
  }
}

TopHexCell.translations = {
  0: [1, 0],
  1: [0, 1],
  2: [-1, 0],
  3: [-1, -1],
  4: [0, -1],
  5: [1, -1]
}

function getTriOpposite(direction) {
  return -1 * (parseInt(direction) - 1) + 1;
}

function UpwardTriCell(x, y) {
  Cell.call(this, x, y, 3);

  this.getTranslations = function () {
    return UpwardTriCell.translations;
  }

  this.getOpposite = getTriOpposite;
}

UpwardTriCell.translations = {
  0: [1, 0],
  1: [0, 1],
  2: [-1, 0]
}

function DownwardTriCell(x, y) {
  Cell.call(this, x, y, 3);

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
  0: [1, 0],
  1: [0, -1],
  2: [-1, 0]
}

function OctCell(x, y) {
  Cell.call(this, x, y, 8);

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
  0: [1, 0],
  1: [0, 1],
  2: [-1, 0],
  3: [0, -1],
  4: [1, 1],
  5: [-1, 1],
  6: [-1, -1],
  7: [1, -1]
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

function getNeighbors(cell, grid, visited) {
  var neighbors = []
  for (let [direction, translation] of Object.entries(cell.getTranslations())) {
    try {
      var neighbor = grid[(cell.x + translation[0]) + "," + (cell.y + translation[1])];
      if (neighbor != null && (visited == null || !visited.has(neighbor))) {
        neighbors.push([neighbor, direction]);
      }
    } catch (err) { }
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

function eller(grid) {

}

// TODO optimize
function kruskal(grid) {
  var disjointSet = new DisjointSet();
  var walls = [];
  for (let i = 0; i < xSize; i++) {
    for (let j = 0; j < ySize; j++) {
      var cell = grid[i + "," + j];
      disjointSet.addSet(cell);
      for (let k of Object.keys(cell.getTranslations())) {
        walls.push([cell, k]);
      }
    }
  }
  while (walls.length > 0) {
    var random = Math.floor(Math.random() * walls.length);
    var [cell, direction] = walls[random];
    var translation = cell.getTranslations()[direction];
    walls.splice(random, 1);
    try {
      var other = grid[(cell.x + translation[0]) + "," + (cell.y + translation[1])];
      if (other != null) {
        if (disjointSet.union(cell, other)) {
          cell.walls[cell.getWallByDirection(direction)] = true;
          other.walls[other.getWallByDirection(other.getOpposite(direction))] = true;
        }
      }
    } catch (err) { }
  }
}

function prim(grid) {
}

function recursiveBacktracking(grid) {
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

function recursiveDivision(grid) {

}

function wilson(grid) {
  /*
  set of every cell not in maze
  add one cell to maze
  while set size > 0
    pick random start
    
  */
}

function draw(cell, drawData) {
  var [centerX, centerY, angle] = drawData;
  var radius = sideLength / Math.sin(Math.PI / cell.wallCount) / 2;
  context.moveTo(centerX + Math.cos(angle) * radius, centerY - Math.sin(angle) * radius);
  for (let i = 0; i < cell.wallCount; i++) {
    angle -= Math.PI * 2 / cell.wallCount;
    if (!cell.walls[i]) {
      context.lineTo(centerX + Math.cos(angle) * radius, centerY - Math.sin(angle) * radius);
    } else {
      context.moveTo(centerX + Math.cos(angle) * radius, centerY - Math.sin(angle) * radius);
    }
  }
}

function generate() {
  xSize = parseInt(document.getElementById("x").value);
  ySize = parseInt(document.getElementById("y").value);
  sideLength = parseInt(document.getElementById("sideLength").value);
  thickness = parseInt(document.getElementById("thickness").value);
  cellShape = document.getElementById("shape").value;
  algorithm = document.getElementById("algorithm").value;
  canvas = document.getElementById("maze");
  context = canvas.getContext("2d");

  switch (cellShape) {
    case "delta":
      this.createCell = function (x, y) {
        if (x % 2 == 1 ^ y % 2 == 1) {
          return new DownwardTriCell(x, y);
        }
        return new UpwardTriCell(x, y);
      }
      this.drawData = function (cell) {
        return [
          (cell.x + 1) * (sideLength * 0.5) + thickness,
          cell instanceof DownwardTriCell ? cell.y * sideLength * SQRT3 / 2 + sideLength / SQRT3 / 2 + thickness :
            (cell.y + 1) * sideLength * SQRT3 / 2 - sideLength / SQRT3 / 2 + thickness,
          cell instanceof DownwardTriCell ? Math.PI / 6 : Math.PI / 2
        ];
      }
      canvas.width = (Math.ceil(xSize / 2) + 1) * sideLength + (thickness * 2);
      canvas.height = ySize * sideLength * (SQRT3 / 2) + (thickness * 2);
      break;
    case "orthogonal":
      this.createCell = function (x, y) {
        return new QuadCell(x, y);
      }
      this.drawData = function (cell) {
        return [(cell.x + 0.5) * sideLength + thickness, (cell.y + 0.5) * sideLength + thickness, Math.PI / 4];
      }
      canvas.width = xSize * sideLength + (thickness * 2);
      canvas.height = ySize * sideLength + (thickness * 2);
      break;
    case "sigma":
      this.createCell = function (x, y) {
        if (x % 2 == 0) {
          return new BottomHexCell(x, y);
        }
        return new TopHexCell(x, y);
      }
      this.drawData = function (cell) {
        return [
          (cell.x + (2 / 3)) * (1.5 * sideLength) + thickness,
          cell instanceof BottomHexCell ? (cell.y + 1) * sideLength * SQRT3 + thickness :
            (cell.y + 0.5) * sideLength * SQRT3 + thickness,
          0
        ];
      }
      canvas.width = (xSize + 1 / 3) * sideLength * 1.5 + (thickness * 2);
      canvas.height = (ySize + 0.5) * sideLength * SQRT3 + (thickness * 2);
      break;
    case "upsilon":
      this.createCell = function (x, y) {
        if (x % 2 == 1 ^ y % 2 == 1) {
          return new QuadCell(x, y);
        }
        return new OctCell(x, y);
      }
      this.drawData = function (cell) {
        var offset = 0.5 * sideLength / Math.SQRT2;
        return [
          (cell.x + 0.5) * (sideLength + sideLength / Math.SQRT2) + offset + thickness,
          (cell.y + 0.5) * (sideLength + sideLength / Math.SQRT2) + offset + thickness,
          cell instanceof QuadCell ? Math.PI / 4 : Math.PI / 8
        ];
      }
      canvas.width = xSize * (sideLength + sideLength / Math.SQRT2) + (sideLength / Math.SQRT2) + (thickness * 2);
      canvas.height = ySize * (sideLength + sideLength / Math.SQRT2) + (sideLength / Math.SQRT2) + (thickness * 2);
      break;
  }

  var start = new Date().getTime();

  var grid = {};
  for (let i = 0; i < xSize; i++) {
    for (let j = 0; j < ySize; j++) {
      grid[i + "," + j] = this.createCell(i, j);
    }
  }

  switch (algorithm) {
    case "aldousBroder":
      aldousBroder(grid);
      break;
    case "kruskal":
      kruskal(grid);
      break;
    case "recursiveBacktracking":
      recursiveBacktracking(grid);
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
      var cell = grid[i + "," + j];
      draw(cell, this.drawData(cell));
    }
  }

  context.stroke();

  console.log("Draw time: " + (new Date().getTime() - start));
}