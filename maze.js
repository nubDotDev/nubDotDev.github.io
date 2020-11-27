const SQRT3 = Math.sqrt(3);

let algorithmElem = document.getElementById("algorithm");
let cellShapeElem = document.getElementById("cellShape");
let xSizeElem = document.getElementById("xSize");
let ySizeElem = document.getElementById("ySize");
let zSizeElem = document.getElementById("zSize");
let horizontalBiasElem = document.getElementById("horizontalBias");
let growingTreeIndexElem = document.getElementById("growingTreeIndex");
let indexBiasElem = document.getElementById("indexBias");
let sideLengthElem = document.getElementById("sideLength");
let thicknessElem = document.getElementById("thickness");
let canvasElem = document.getElementById("maze");
let context = canvasElem.getContext("2d");

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

  this.getSouthEasterns = function () {
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
    let radius = sideLength / Math.sin(Math.PI / this.wallCount) / 2;
    context.moveTo(centerX + Math.cos(angle) * radius, centerY - Math.sin(angle) * radius);
    for (let i = 0; i < this.wallCount; i++) {
      angle -= Math.PI * 2 / this.wallCount;
      let toFunction = this.walls[i] ? context.moveTo.bind(context) : context.lineTo.bind(context);
      toFunction(centerX + Math.cos(angle) * radius, centerY - Math.sin(angle) * radius);
    }
  }
}

function QuadCell(x, z) {
  Cell.call(this, x, 0, z, 4);

  this.getTranslations = function () {
    return [
      [1, 0, 0],
      [0, 0, 1],
      [-1, 0, 0],
      [0, 0, -1]
    ];
  }

  this.getSouthEasterns = function () {
    return [0, 1];
  }
}

function BottomHexCell(x, z) {
  Cell.call(this, x, 0, z, 6);

  this.getTranslations = function () {
    return [
      [1, 0, 1],
      [0, 0, 1],
      [-1, 0, 1],
      [-1, 0, 0],
      [0, 0, -1],
      [1, 0, 0]
    ];
  }

  this.getSouthEasterns = function () {
    return [0, 1, 5];
  }
}

function TopHexCell(x, z) {
  Cell.call(this, x, 0, z, 6);

  this.getTranslations = function () {
    return [
      [1, 0, 0],
      [0, 0, 1],
      [-1, 0, 0],
      [-1, 0, -1],
      [0, 0, -1],
      [1, 0, -1]
    ];
  }

  this.getSouthEasterns = function () {
    return [0, 1];
  }
}

function getTriOpposite(direction) {
  return -1 * (parseInt(direction) - 1) + 1;
}

function UpwardTriCell(x, z) {
  Cell.call(this, x, 0, z, 3);

  this.getTranslations = function () {
    return [
      [1, 0, 0],
      [0, 0, 1],
      [-1, 0, 0]
    ];
  }

  this.getSouthEasterns = function () {
    return [0, 1];
  }

  this.getOpposite = getTriOpposite;
}

function DownwardTriCell(x, z) {
  Cell.call(this, x, 0, z, 3);

  this.getTranslations = function () {
    return [
      [1, 0, 0],
      [0, 0, -1],
      [-1, 0, 0]
    ];
  }

  this.getSouthEasterns = function () {
    return [0];
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

function OctCell(x, z) {
  Cell.call(this, x, 0, z, 8);

  this.getTranslations = function () {
    return [
      [1, 0, 0],
      [0, 0, 1],
      [-1, 0, 0],
      [0, 0, -1],
      [1, 0, 1],
      [-1, 0, 1],
      [-1, 0, -1],
      [1, 0, -1]
    ];
  }

  this.getSouthEasterns = function () {
    return [0, 1, 4];
  }

  this.getOpposite = function (direction) {
    let d = parseInt(direction);
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

function CubeCell(x, y, z) {
  Cell.call(this, x, y, z, 6);

  this.getTranslations = function () {
    return [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
      [-1, 0, 0],
      [0, -1, 0],
      [0, 0, -1]
    ];
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
    let radius = sideLength / Math.sin(Math.PI / 4) / 2;
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

function DisjointSet() {
  this.universe = new WeakMap();

  this.addSet = function (set) {
    this.universe.set(set, set);
  }

  this.find = function (set) {
    if (set == this.universe.get(set)) {
      return set;
    }
    let root = this.find(this.universe.get(set));
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
  let neighbors = [];
  for (let [direction, translation] of Object.entries(cell.getTranslations())) {
    let neighbor = getNeighbor(cell, translation, grid);
    if (neighbor != null && (!inverse == (visited == null || !visited.has(neighbor)))) {
      neighbors.push([neighbor, direction]);
    }
  }
  return neighbors;
}

function aldousBroder(grid) {
  let values = Object.values(grid);
  let current = values[Math.floor(Math.random() * values.length)];
  let visited = new Set();
  visited.add(current);
  while (visited.size < values.length) {
    let neighbors = getNeighbors(current, grid);
    let [next, direction] = neighbors[Math.floor(Math.random() * neighbors.length)];
    if (!visited.has(next)) {
      current.walls[current.getWallByDirection(direction)] = true;
      next.walls[next.getWallByDirection(next.getOpposite(direction))] = true;
      visited.add(next);
    }
    current = next;
  }
}

function eller(grid) {
  let prevRow = new DisjointSet();
  for (let z = 0; z < zSize; z++) {
    let currentRow = new DisjointSet();
    let passages = new WeakMap();
    for (let x = 0; x < xSize; x++) {
      let cell = grid[x + ",0," + z];
      if (prevRow.universe.has(cell)) {
        let root = prevRow.find(cell);
        let newRoot = passages.get(root);
        if (newRoot) {
          currentRow.universe.set(cell, newRoot);
        } else {
          currentRow.addSet(cell);
          passages.set(root, cell);
        }
      } else {
        currentRow.addSet(cell);
      }
    }
    let sets = [[]];
    let k = 0;
    let isLastRow = z == zSize - 1;
    for (let x = 0; x < xSize; x++) {
      let current = grid[x + ",0," + z];
      sets[k].push(current);
      if ((isLastRow || Math.random() < horizontalBias) && x < xSize - 1) {
        let next = grid[(x + 1) + ",0," + z];
        if (currentRow.union(current, next)) {
          current.walls[0] = true;
          next.walls[2] = true;
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
      let index = Math.floor(Math.random() * set.length);
      for (let i = 0; i < set.length; i++) {
        if (i == index || Math.random() < (1 - horizontalBias) * (xSize - sets.length) / xSize) {
          set[i].walls[1] = true;
          let cell = getNeighbor(set[i], [0, 0, 1], grid);
          cell.walls[3] = true;
          currentRow.universe.set(cell, set[i]);
        }
      }
    }
    prevRow = currentRow;
  }
}

function growingTree(grid) {
  let values = Object.values(grid);
  let maze = [values[Math.floor(Math.random() * values.length)]];
  let visited = new Set(maze);
  while (maze.length > 0) {
    let random = Math.floor((1 - indexBias) * Math.random() * growingTreeIndex * maze.length + indexBias * (growingTreeIndex * (maze.length - 1)));
    let cell = maze[random];
    let neighbors = getNeighbors(cell, grid, visited);
    if (neighbors.length == 0) {
      maze.splice(random, 1);
    } else {
      let [next, direction] = neighbors[Math.floor(Math.random() * neighbors.length)];
      cell.walls[cell.getWallByDirection(direction)] = true;
      next.walls[next.getWallByDirection(next.getOpposite(direction))] = true;
      maze.push(next);
      visited.add(next);
    }
  }
}

function huntAndKill(grid) {
  let values = Object.values(grid);
  let current = values[Math.floor(Math.random() * values.length)];
  let visited = new Set();
  visited.add(current);
  while (visited.size < values.length) {
    let neighbors = getNeighbors(current, grid, visited);
    if (neighbors.length > 0) {
      let [next, direction] = neighbors[Math.floor(Math.random() * neighbors.length)];
      current.walls[current.getWallByDirection(direction)] = true;
      next.walls[next.getWallByDirection(next.getOpposite(direction))] = true;
      current = next;
      visited.add(current);
    } else {
      for (let cell of values) {
        if (!visited.has(cell)) {
          let neighbors = getNeighbors(cell, grid, visited, true);
          if (neighbors.length > 0) {
            current = cell;
            let [other, direction] = neighbors[Math.floor(Math.random() * neighbors.length)];
            current.walls[current.getWallByDirection(direction)] = true;
            other.walls[other.getWallByDirection(other.getOpposite(direction))] = true;
            visited.add(current);
            break;
          }
        }
      }
    }
  }
}

function kruskal(grid) {
  let disjointSet = new DisjointSet();
  let walls = [];
  for (let cell of Object.values(grid)) {
    disjointSet.addSet(cell);
    for (let direction of Object.keys(cell.getTranslations())) {
      walls.push([cell, direction]);
    }
  }
  while (walls.length > 0) {
    let random = Math.floor(Math.random() * walls.length);
    let [cell, direction] = walls[random];
    walls.splice(random, 1);
    let other = getNeighbor(cell, cell.getTranslations()[direction], grid);
    if (other != null) {
      if (disjointSet.union(cell, other)) {
        cell.walls[cell.getWallByDirection(direction)] = true;
        other.walls[other.getWallByDirection(other.getOpposite(direction))] = true;
      }
    }
  }
}

function nAryTree(grid) {
  for (let cell of Object.values(grid)) {
    let directions = cell.getSouthEasterns();
    while (directions.length > 0) {
      let random = Math.floor(Math.random() * directions.length);
      let direction = directions[random];
      let other = getNeighbor(cell, cell.getTranslations()[direction], grid);
      if (other) {
        cell.walls[cell.getWallByDirection(direction)] = true;
        other.walls[other.getWallByDirection(other.getOpposite(direction))] = true;
        break;
      }
      directions.splice(random, 1);
    }
  }
}

function prim(grid) {
  let visited = new Set;
  let values = Object.values(grid);
  let start = values[Math.floor(Math.random() * values.length)];
  visited.add(start);
  let frontier = [];
  for (let neighbor of getNeighbors(start, grid)) {
    frontier.push(neighbor);
  }
  while (frontier.length > 0) {
    let random = Math.floor(Math.random() * frontier.length);
    let [cell, direction] = frontier[random];
    frontier.splice(random, 1);
    if (!visited.has(cell)) {
      let opposite = cell.getOpposite(direction);
      cell.walls[cell.getWallByDirection(opposite)] = true;
      let other = getNeighbor(cell, cell.getTranslations()[opposite], grid);
      other.walls[other.getWallByDirection(direction)] = true;
      visited.add(cell);
    }
    for (let neighbor of getNeighbors(cell, grid, visited)) {
      frontier.push(neighbor);
    }
  }
}

function recursiveBacktracking(grid) {
  let values = Object.values(grid);
  let current = values[Math.floor(Math.random() * values.length)];
  let visited = new Set();
  visited.add(current);
  let backtrack = [];
  while (visited.size < values.length) {
    let neighbors = getNeighbors(current, grid, visited);
    if (neighbors.length > 0) {
      let [next, direction] = neighbors[Math.floor(Math.random() * neighbors.length)];
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
  for (let cell of Object.values(grid)) {
    cell.walls[0] = cell.x != xSize - 1;
    cell.walls[1] = cell.z != zSize - 1;
    cell.walls[2] = cell.x != 0;
    cell.walls[3] = cell.z != 0;
  }

  let divide = function (x1, z1, width, length) {
    if (width > 1 && length > 1) {
      if (width < length || (width == length && Math.round(Math.random()))) {
        let path = x1 + Math.floor(Math.random() * width);
        let z = z1 + Math.floor(Math.random() * (length - 1));
        for (let x = x1; x < x1 + width; x++) {
          if (x != path) {
            let cell = grid[x + ",0," + z];
            cell.walls[1] = false;
            getNeighbor(cell, cell.getTranslations()[1], grid).walls[3] = false;
          }
        }
        divide(x1, z1, width, z - z1 + 1);
        divide(x1, z + 1, width, length - (z - z1 + 1));
      } else {
        let path = z1 + Math.floor(Math.random() * length);
        let x = x1 + Math.floor(Math.random() * (width - 1));
        for (let z = z1; z < z1 + length; z++) {
          if (z != path) {
            let cell = grid[x + ",0," + z];
            cell.walls[0] = false;
            getNeighbor(cell, cell.getTranslations()[0], grid).walls[2] = false;
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
    while (current != null) {
      let next = getNeighbor(current, [1, 0, 0], grid);
      run.push(current);
      if (Math.random() < horizontalBias && current.x != xSize - 1) {
        current.walls[0] = true;
        next.walls[2] = true;
      } else {
        let pop = run[Math.floor(Math.random() * run.length)];
        pop.walls[3] = true;
        getNeighbor(pop, [0, 0, -1], grid).walls[1] = true;
        run = [];
      }
      current = next;
    }
  }
}

function wilson(grid) {
  let values = Object.values(grid);
  let notMaze = new Set(values);
  notMaze.delete(values[Math.floor(Math.random() * values.length)]);
  while (notMaze.size > 0) {
    let path = new WeakMap();
    let start = values[Math.floor(Math.random() * values.length)];
    let current = start;
    while (notMaze.has(current)) {
      let neighbors = getNeighbors(current, grid);
      let [next, direction] = neighbors[Math.floor(Math.random() * neighbors.length)];
      path.set(current, direction);
      current = next;
    }
    current = start;
    while (notMaze.has(current)) {
      notMaze.delete(current);
      let direction = path.get(current);
      current.walls[current.getWallByDirection(direction)] = true;
      current = getNeighbor(current, current.getTranslations()[direction], grid);
      current.walls[current.getWallByDirection(current.getOpposite(direction))] = true;
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
        let offset = 0.5 * sideLength / Math.SQRT2;
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

  let grid = {};
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
        let cell = grid[x + "," + y + "," + z];
        cell.draw(this.drawData(cell));
      }
    }
  }

  context.stroke();

  console.log("Draw time: " + (new Date().getTime() - start));

  document.getElementById("download").style.display = "block";
}

function algorithmChange() {
  cellShapeElem.disabled = false;
  cellShapeElem.options[1].disabled = false;
  cellShapeElem.options[5].disabled = false;
  horizontalBiasElem.disabled = true;
  growingTreeIndexElem.disabled = true;
  indexBiasElem.disabled = true;
  switch (algorithmElem.value) {
    case "eller":
    case "recursiveDivision":
    case "sidewinder":
      cellShapeElem.disabled = true;
      cellShapeElem.value = "orthogonal";
      cellShapeChange();
      horizontalBiasElem.disabled = false;
      break;
    case "growingTree":
      indexBiasElem.disabled = false;
      growingTreeIndexElem.disabled = false;
      break;
    case "nAryTree":
      cellShapeElem.options[1].disabled = true;
      cellShapeElem.options[5].disabled = true;
      break;
  }
  if ((cellShapeElem.options[1].disabled && cellShapeElem.value == "delta") ||
    (cellShapeElem.options[5].disabled && cellShapeElem.value == "3d")) {
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
  let image = canvasElem.toDataURL("maze/png");
  document.getElementById("download").href = image;
}