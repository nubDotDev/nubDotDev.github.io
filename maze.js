const SQRT3 = Math.sqrt(3);

const algorithmElem = document.getElementById("algorithm");
const cellShapeElem = document.getElementById("cellShape");
const xSizeElem = document.getElementById("xSize");
const ySizeElem = document.getElementById("ySize");
const zSizeElem = document.getElementById("zSize");
const horizontalBiasElem = document.getElementById("horizontalBias");
const growingTreeIndexElem = document.getElementById("growingTreeIndex");
const indexBiasElem = document.getElementById("indexBias");
const sideLengthElem = document.getElementById("sideLength");
const thicknessElem = document.getElementById("thickness");
const canvasElem = document.getElementById("maze");
const context = canvasElem.getContext("2d");

let algorithm, cellShape;
let xSize, ySize, zSize;
let horizontalBias, growingTreeIndex, indexBias;
let sideLength, thickness;

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
    return [];
  }

  this.getOpposite = function (direction) {
    return (parseInt(direction) + (this.wallCount / 2)) % this.wallCount;
  }

  this.getWallByDirection = function (direction) {
    return direction;
  }

  this.draw = function (drawData) {
    let [centerX, centerY, angle] = drawData;
    const radius = sideLength / Math.sin(Math.PI / this.wallCount) / 2;
    context.moveTo(centerX + Math.cos(angle) * radius, centerY - Math.sin(angle) * radius);
    for (let i = 0; i < this.wallCount; i++) {
      angle -= Math.PI * 2 / this.wallCount;
      const toFunction = this.walls[i] ? context.moveTo.bind(context) : context.lineTo.bind(context);
      toFunction(centerX + Math.cos(angle) * radius, centerY - Math.sin(angle) * radius);
    }
  }
}

function QuadCell(x, z) {
  Cell.call(this, x, 0, z, 4);

  this.getTranslations = function () {
    return QuadCell.translations;
  }
}

QuadCell.translations = [
  [1, 0, 0],
  [0, 0, 1],
  [-1, 0, 0],
  [0, 0, -1]
];

function BottomHexCell(x, z) {
  Cell.call(this, x, 0, z, 6);

  this.getTranslations = function () {
    return BottomHexCell.translations;
  }
}

BottomHexCell.translations = [
  [1, 0, 1],
  [0, 0, 1],
  [-1, 0, 1],
  [-1, 0, 0],
  [0, 0, -1],
  [1, 0, 0]
];

function TopHexCell(x, z) {
  Cell.call(this, x, 0, z, 6);

  this.getTranslations = function () {
    return TopHexCell.translations;
  }
}

TopHexCell.translations = [
  [1, 0, 0],
  [0, 0, 1],
  [-1, 0, 0],
  [-1, 0, -1],
  [0, 0, -1],
  [1, 0, -1]
];

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

UpwardTriCell.translations = [
  [1, 0, 0],
  [0, 0, 1],
  [-1, 0, 0]
];

function DownwardTriCell(x, z) {
  Cell.call(this, x, 0, z, 3);

  this.getTranslations = function () {
    return DownwardTriCell.translations
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

DownwardTriCell.translations = [
  [1, 0, 0],
  [0, 0, -1],
  [-1, 0, 0]
];

function OctCell(x, z) {
  Cell.call(this, x, 0, z, 8);

  this.getTranslations = function () {
    return OctCell.translations
  }

  this.getOpposite = function (direction) {
    const d = parseInt(direction);
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

OctCell.translations = [
  [1, 0, 0],
  [0, 0, 1],
  [-1, 0, 0],
  [0, 0, -1],
  [1, 0, 1],
  [-1, 0, 1],
  [-1, 0, -1],
  [1, 0, -1]
];

function CubeCell(x, y, z) {
  Cell.call(this, x, y, z, 6);

  this.getTranslations = function () {
    return CubeCell.translations
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
    let [centerX, centerY, angle] = drawData;
    const radius = sideLength / Math.sin(Math.PI / 4) / 2;
    context.moveTo(centerX + Math.cos(angle) * radius, centerY - Math.sin(angle) * radius);
    for (let i = 0; i < 4; i++) {
      angle -= Math.PI / 2;
      const toFunction = this.walls[i] ? context.moveTo.bind(context) : context.lineTo.bind(context);
      toFunction(centerX + Math.cos(angle) * radius, centerY - Math.sin(angle) * radius);
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

CubeCell.translations = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
  [-1, 0, 0],
  [0, -1, 0],
  [0, 0, -1]
];

function DisjointSet() {
  this.universe = new WeakMap();

  this.addSet = function (set) {
    this.universe.set(set, set);
  }

  this.find = function (set) {
    if (set == this.universe.get(set)) {
      return set;
    }
    const root = this.find(this.universe.get(set));
    this.universe.set(set, root);
    return root;
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

function getNeighbors(cell, grid, visited, inverse) {
  const neighbors = [];
  for (let i = 0; i < cell.wallCount; i++) {
    const neighbor = getNeighbor(cell, cell.getTranslations()[i], grid);
    if (neighbor && (!inverse == (!visited || !visited.has(neighbor)))) {
      neighbors.push([neighbor, i]);
    }
  }
  return neighbors;
}

function breakWall(cell, other, direction, build) {
  cell.walls[cell.getWallByDirection(direction)] = !build;
  other.walls[other.getWallByDirection(other.getOpposite(direction))] = !build;
}

function aldousBroder(grid) {
  const cells = Object.values(grid);
  let current = cells[Math.floor(Math.random() * cells.length)];
  const visited = new Set([current]);
  while (visited.size < cells.length) {
    const neighbors = getNeighbors(current, grid);
    const [next, direction] = neighbors[Math.floor(Math.random() * neighbors.length)];
    if (!visited.has(next)) {
      breakWall(current, next, direction);
      visited.add(next);
    }
    current = next;
  }
}

function eller(grid) {
  let prevRow = new DisjointSet();
  for (let z = 0; z < zSize; z++) {
    const currentRow = new DisjointSet();
    for (let x = 0; x < xSize; x++) {
      const cell = grid[x + ",0," + z];
      if (prevRow.universe.has(cell)) {
        const root = prevRow.find(cell);
        currentRow.addSet(root);
        currentRow.universe.set(cell, root);
      } else {
        currentRow.addSet(cell);
      }
    }
    const sets = [[]];
    let k = 0;
    const isLastRow = z == zSize - 1;
    for (let x = 0; x < xSize; x++) {
      const current = grid[x + ",0," + z];
      sets[k].push(current);
      if ((isLastRow || Math.random() < horizontalBias) && x < xSize - 1) {
        const next = grid[(x + 1) + ",0," + z];
        if (currentRow.union(current, next)) {
          breakWall(current, next, 0);
        }
      } else {
        k++;
        sets[k] = []
      }
    }
    if (isLastRow) {
      return;
    }
    for (let set of sets) {
      const index = Math.floor(Math.random() * set.length);
      for (let i = 0; i < set.length; i++) {
        if (i == index || Math.random() < (1 - horizontalBias) * (xSize - sets.length) / xSize) {
          const other = getNeighbor(set[i], [0, 0, 1], grid);
          breakWall(set[i], other, 1);
          currentRow.universe.set(other, set[i]);
        }
      }
    }
    prevRow = currentRow;
  }
}

function growingTree(grid) {
  const cells = Object.values(grid);
  const maze = [cells[Math.floor(Math.random() * cells.length)]];
  const visited = new Set(maze);
  while (maze.length > 0) {
    const random = Math.floor((1 - indexBias) * Math.random() * maze.length + indexBias * growingTreeIndex * (maze.length - 1));
    const cell = maze[random];
    const neighbors = getNeighbors(cell, grid, visited);
    if (neighbors.length == 0) {
      maze.splice(random, 1);
    } else {
      const [next, direction] = neighbors[Math.floor(Math.random() * neighbors.length)];
      breakWall(cell, next, direction);
      maze.push(next);
      visited.add(next);
    }
  }
}

function huntAndKill(grid) {
  const cells = Object.values(grid);
  let current = cells[Math.floor(Math.random() * cells.length)];
  const visited = new Set([current]);
  while (visited.size < cells.length) {
    const neighbors = getNeighbors(current, grid, visited);
    if (neighbors.length > 0) {
      const [next, direction] = neighbors[Math.floor(Math.random() * neighbors.length)];
      breakWall(current, next, direction);
      current = next;
      visited.add(current);
    } else {
      for (let cell of cells) {
        if (!visited.has(cell)) {
          const neighbors = getNeighbors(cell, grid, visited, true);
          if (neighbors.length > 0) {
            const [other, direction] = neighbors[Math.floor(Math.random() * neighbors.length)];
            breakWall(cell, other, direction);
            current = cell;
            visited.add(current);
            break;
          }
        }
      }
    }
  }
}

function kruskal(grid) {
  const disjointSet = new DisjointSet();
  const walls = [];
  for (let cell of Object.values(grid)) {
    disjointSet.addSet(cell);
    for (let direction = 0; direction < cell.wallCount; direction++) {
      walls.push([cell, direction]);
    }
  }
  while (walls.length > 0) {
    const random = Math.floor(Math.random() * walls.length);
    const [cell, direction] = walls[random];
    const other = getNeighbor(cell, cell.getTranslations()[direction], grid);
    if (other && disjointSet.union(cell, other)) {
      breakWall(cell, other, direction);
    }
    walls.splice(random, 1);
  }
}

function nAryTree(grid) {
  for (let cell of Object.values(grid)) {
    const directions = nAryTree.getSouthEasterns(cell);
    while (directions.length > 0) {
      const random = Math.floor(Math.random() * directions.length);
      const direction = directions[random];
      const other = getNeighbor(cell, cell.getTranslations()[direction], grid);
      if (other) {
        breakWall(cell, other, direction);
        break;
      }
      directions.splice(random, 1);
    }
  }
}

nAryTree.getSouthEasterns = function (cell) {
  switch (cell.constructor.name) {
    case "QuadCell":
      return [0, 1];
    case "BottomHexCell":
      return [0, 1, 5];
    case "TopHexCell":
      return [0, 1];
    case "OctCell":
      return [0, 1, 4];
    case "CubeCell":
      return [0, 1, 2];
  }
}

function prim(grid) {
  const cells = Object.values(grid);
  let wallCount = 0;
  for (let cell of cells) {
    wallCount += cell.wallCount;
  }
  const weights = new WeakMap();
  const range = [...Array(wallCount).keys()];
  for (let cell of cells) {
    const cellWeights = [];
    for (let direction = 0; direction < cell.wallCount; direction++) {
      const random = Math.floor(Math.random() * range.length);
      cellWeights[direction] = range[random];
      range.splice(random, 1);
    }
    weights.set(cell, cellWeights);
  }
  const start = cells[Math.floor(Math.random() * cells.length)];
  const visited = new Set([start]);
  const frontier = Array(wallCount);
  const startWeights = weights.get(start);
  for (let i = 0; i < startWeights.length; i++) {
    frontier[startWeights[i]] = [start, i];
  }
  while (visited.size < cells.length) {
    for (let i = frontier.length - 1; i >= 0; i--) {
      if (frontier[i]) {
        const [cell, direction] = frontier[i];
        const other = getNeighbor(cell, cell.getTranslations()[direction], grid);
        if (other && !visited.has(other)) {
          breakWall(cell, other, direction);
          const otherWeights = weights.get(other);
          for (let i = 0; i < otherWeights.length; i++) {
            frontier[otherWeights[i]] = [other, i];
          }
          visited.add(other);
        }
        frontier[i] = 0;
        break;
      }
    }
  }
}

function recursiveBacktracking(grid) {
  const cells = Object.values(grid);
  let current = cells[Math.floor(Math.random() * cells.length)];
  const visited = new Set([current]);
  const backtrack = [];
  while (visited.size < cells.length) {
    const neighbors = getNeighbors(current, grid, visited);
    if (neighbors.length > 0) {
      const [next, direction] = neighbors[Math.floor(Math.random() * neighbors.length)];
      breakWall(current, next, direction);
      backtrack.push(current);
      current = next;
      visited.add(current);
    } else {
      current = backtrack.pop();
    }
  }
}

function recursiveDivision(grid) {
  for (let cell of Object.values(grid)) {
    cell.walls[0] = cell.x != xSize - 1;
    cell.walls[1] = cell.z != zSize - 1;
    cell.walls[2] = cell.x != 0;
    cell.walls[3] = cell.z != 0;
  }

  const divide = function (x1, z1, width, length) {
    if (width > 1 && length > 1) {
      if (width < length || (width == length && Math.round(Math.random()))) {
        const path = x1 + Math.floor(Math.random() * width);
        const z = z1 + Math.floor(Math.random() * (length - 1));
        for (let x = x1; x < x1 + width; x++) {
          if (x != path) {
            const cell = grid[x + ",0," + z];
            breakWall(cell, getNeighbor(cell, cell.getTranslations()[1], grid), 1, true);
          }
        }
        divide(x1, z1, width, z - z1 + 1);
        divide(x1, z + 1, width, length - (z - z1 + 1));
      } else {
        const path = z1 + Math.floor(Math.random() * length);
        const x = x1 + Math.floor(Math.random() * (width - 1));
        for (let z = z1; z < z1 + length; z++) {
          if (z != path) {
            const cell = grid[x + ",0," + z];
            breakWall(cell, getNeighbor(cell, cell.getTranslations()[0], grid), 0, true);
          }
        }
        divide(x1, z1, x - x1 + 1, length);
        divide(x + 1, z1, width - (x - x1 + 1), length);
      }
    }
  }

  divide(0, 0, xSize, zSize);
}

function sidewinder(grid) {
  for (let x = 0; x < xSize - 1; x++) {
    grid[x + ",0,0"].walls[0] = true;
    grid[(x + 1) + ",0,0"].walls[2] = true;
  }
  for (let z = 1; z < zSize; z++) {
    let run = [];
    current = grid["0,0," + z];
    while (current) {
      const next = getNeighbor(current, [1, 0, 0], grid);
      run.push(current);
      if (Math.random() < horizontalBias && current.x != xSize - 1) {
        breakWall(current, next, 0);
      } else {
        const cell = run[Math.floor(Math.random() * run.length)];
        breakWall(cell, getNeighbor(cell, [0, 0, -1], grid), 3);
        run = [];
      }
      current = next;
    }
  }
}

function wilson(grid) {
  const cells = Object.values(grid);
  const notMaze = new Set(cells);
  notMaze.delete(cells[Math.floor(Math.random() * cells.length)]);
  while (notMaze.size > 0) {
    const run = new WeakMap();
    const start = cells[Math.floor(Math.random() * cells.length)];
    let current = start;
    while (notMaze.has(current)) {
      const neighbors = getNeighbors(current, grid);
      const [next, direction] = neighbors[Math.floor(Math.random() * neighbors.length)];
      run.set(current, direction);
      current = next;
    }
    current = start;
    while (notMaze.has(current)) {
      notMaze.delete(current);
      const direction = run.get(current);
      const next = getNeighbor(current, current.getTranslations()[direction], grid);
      breakWall(current, next, direction);
      current = next;
    }
  }
}

function generate() {
  algorithm = algorithmElem.value;
  cellShape = cellShapeElem.value;
  xSize = parseInt(xSizeElem.value);
  ySize = ySizeElem.disabled ? 1 : parseInt(ySizeElem.value);
  zSize = parseInt(zSizeElem.value);
  horizontalBias = parseFloat(horizontalBiasElem.value);
  growingTreeIndex = parseFloat(growingTreeIndexElem.value);
  indexBias = parseFloat(indexBiasElem.value);
  sideLength = parseInt(sideLengthElem.value);
  thickness = parseInt(thicknessElem.value);

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
          cell instanceof DownwardTriCell ?
            cell.z * sideLength * SQRT3 / 2 + sideLength / SQRT3 / 2 + thickness :
            (cell.z + 1) * sideLength * SQRT3 / 2 - sideLength / SQRT3 / 2 + thickness,
          cell instanceof DownwardTriCell ? Math.PI / 6 : Math.PI / 2
        ];
      }
      canvasElem.width = (Math.ceil(xSize / 2) + 1) * sideLength + (thickness * 2);
      canvasElem.height = zSize * sideLength * (SQRT3 / 2) + (thickness * 2);
      break;
    case "orthogonal":
      this.createCell = function (x, y, z) {
        return new QuadCell(x, z);
      }
      this.drawData = function (cell) {
        return [(cell.x + 0.5) * sideLength + thickness, (cell.z + 0.5) * sideLength + thickness, Math.PI / 4];
      }
      canvasElem.width = xSize * sideLength + (thickness * 2);
      canvasElem.height = zSize * sideLength + (thickness * 2);
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
          cell instanceof BottomHexCell ?
            (cell.z + 1) * sideLength * SQRT3 + thickness :
            (cell.z + 0.5) * sideLength * SQRT3 + thickness,
          0
        ];
      }
      canvasElem.width = (xSize + 1 / 3) * sideLength * 1.5 + (thickness * 2);
      canvasElem.height = (zSize + 0.5) * sideLength * SQRT3 + (thickness * 2);
      break;
    case "upsilon":
      this.createCell = function (x, y, z) {
        if (x % 2 == 1 ^ z % 2 == 1) {
          return new QuadCell(x, z);
        }
        return new OctCell(x, z);
      }
      this.drawData = function (cell) {
        const offset = 0.5 * sideLength / Math.SQRT2;
        return [
          (cell.x + 0.5) * (sideLength + sideLength / Math.SQRT2) + offset + thickness,
          (cell.z + 0.5) * (sideLength + sideLength / Math.SQRT2) + offset + thickness,
          cell instanceof QuadCell ? Math.PI / 4 : Math.PI / 8
        ];
      }
      canvasElem.width = xSize * (sideLength + sideLength / Math.SQRT2) + (sideLength / Math.SQRT2) + (thickness * 2);
      canvasElem.height = zSize * (sideLength + sideLength / Math.SQRT2) + (sideLength / Math.SQRT2) + (thickness * 2);
      break;
    case "3d":
      this.createCell = function (x, y, z) {
        return new CubeCell(x, y, z);
      }
      this.drawData = function (cell) {
        return [(cell.x + 0.5) * sideLength + thickness, (cell.z + 0.5) * sideLength + cell.y * (zSize + 1) * sideLength + thickness, Math.PI / 4];
      }
      canvasElem.width = xSize * sideLength + (thickness * 2);
      canvasElem.height = ySize * (zSize * sideLength) + (ySize - 1) * sideLength + (thickness * 2);
      break;
  }

  let start = new Date().getTime();

  const grid = {};
  for (let x = 0; x < xSize; x++) {
    for (let y = 0; y < ySize; y++) {
      for (let z = 0; z < zSize; z++) {
        grid[x + "," + y + "," + z] = this.createCell(x, y, z);
      }
    }
  }

  if (algorithm != "defaultAlgorithm") {
    eval(algorithm)(grid);
  }
  console.log("Generation time: " + (new Date().getTime() - start));
  start = new Date().getTime();

  context.lineWidth = thickness;
  context.clearRect(0, 0, canvasElem.width, canvasElem.height);
  context.fillStyle = "#ffffff"
  context.beginPath();
  context.fillRect(0, 0, canvasElem.width, canvasElem.height);
  context.fill();
  context.fillStyle = "#000000"

  for (let x = 0; x < xSize; x++) {
    for (let y = 0; y < ySize; y++) {
      for (let z = 0; z < zSize; z++) {
        const cell = grid[x + "," + y + "," + z];
        cell.draw(this.drawData(cell));
      }
    }
  }

  context.stroke();

  console.log("Draw time: " + (new Date().getTime() - start));
}

function algorithmChange() {
  cellShapeElem.disabled = false;
  cellShapeElem.options[1].disabled = false;
  horizontalBiasElem.disabled = true;
  growingTreeIndexElem.disabled = true;
  indexBiasElem.disabled = true;
  switch (algorithmElem.value) {
    case "eller":
    case "sidewinder":
      horizontalBiasElem.disabled = false;
    case "recursiveDivision":
      cellShapeElem.disabled = true;
      cellShapeElem.value = "orthogonal";
      cellShapeChange();
      break;
    case "growingTree":
      indexBiasElem.disabled = false;
      growingTreeIndexElem.disabled = false;
      break;
    case "nAryTree":
      cellShapeElem.options[1].disabled = true;
      break;
  }
  if (cellShapeElem.options[1].disabled && cellShapeElem.value == "delta") {
    cellShapeElem.value = "defaultShape";
    cellShapeChange();
  }
}

function cellShapeChange() {
  ySizeElem.disabled = true;
  if (cellShapeElem.value == "3d") {
    ySizeElem.disabled = false;
  }
}

function downloadMaze() {
  const image = canvasElem.toDataURL("maze/png");
  document.getElementById("download").href = image;
}
