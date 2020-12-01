const SQRT3 = Math.sqrt(3);

const algorithmElem = document.getElementById("algorithm");
const cellShapeElem = document.getElementById("cellShape");
const xSizeElem = document.getElementById("xSize");
const ySizeElem = document.getElementById("ySize");
const zSizeElem = document.getElementById("zSize");
const horizontalBiasElem = document.getElementById("horizontalBias");
const indexAnchorElem = document.getElementById("indexAnchor");
const anchorBiasElem = document.getElementById("anchorBias");
const sideLengthElem = document.getElementById("sideLength");
const thicknessElem = document.getElementById("lineThickness");
const canvasElem = document.getElementById("maze");
const context = canvasElem.getContext("2d");

let algorithm, cellShape;
let xSize, ySize, zSize;
let horizontalBias, indexAnchor, anchorBias;
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
  };

  this.getTranslation = function (direction) {
    return this.getTranslations()[direction];
  };

  this.getOpposite = function (direction) {
    return (direction + (this.wallCount / 2)) % this.wallCount;
  };

  this.getWallDirections = function () {
    return [];
  };

  this.getWallByDirection = function (direction) {
    return this.getWallDirections()[direction];
  };

  this.draw = function (drawData) {
    let [centerX, centerY, angle] = drawData;
    const wall2dCount = wallCount - 2;
    const radius = sideLength / Math.sin(Math.PI / wall2dCount) / 2;
    context.moveTo(centerX + Math.cos(angle) * radius, centerY - Math.sin(angle) * radius);
    for (let i = 0; i < wall2dCount; i++) {
      angle -= Math.PI * 2 / wall2dCount;
      const toFunction = this.walls[i] ? context.moveTo.bind(context) : context.lineTo.bind(context);
      toFunction(centerX + Math.cos(angle) * radius, centerY - Math.sin(angle) * radius);
    }
    if (this.walls[wall2dCount]) {
      context.moveTo(centerX - radius / 3, centerY + radius / 3);
      context.lineTo(centerX + radius / 3, centerY - radius / 3)
    }
    if (this.walls[wall2dCount + 1]) {
      context.moveTo(centerX - radius / 3, centerY - radius / 3);
      context.lineTo(centerX + radius / 3, centerY + radius / 3)
    }
  };
}

function TriCell(x, y, z, upward) {
  Cell.call(this, x, y, z, 5);
  this.upward = upward;

  this.getTranslations = function () {
    return upward ? TriCell.upwardTranslations : TriCell.downwardTranslations;
  };

  this.getOpposite = function (direction) {
    return -1 * (direction - 2) + 2;
  };

  this.getWallDirections = function () {
    return upward ? TriCell.upwardWallDirections : TriCell.downwardWallDirections;
  };
}

TriCell.upwardTranslations = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
  [0, -1, 0],
  [-1, 0, 0]
];

TriCell.downwardTranslations = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, -1],
  [0, -1, 0],
  [-1, 0, 0]
];

TriCell.upwardWallDirections = [0, 3, 1, 4, 2];
TriCell.downwardWallDirections = [0, 3, 2, 4, 1];

function QuadCell(x, y, z) {
  Cell.call(this, x, y, z, 6);

  this.getTranslations = function () {
    return QuadCell.translations;
  };

  this.getWallDirections = function () {
    return QuadCell.wallDirections;
  };
}

QuadCell.translations = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
  [-1, 0, 0],
  [0, -1, 0],
  [0, 0, -1]
];

QuadCell.wallDirections = [0, 4, 1, 2, 5, 3];

function HexCell(x, y, z, top) {
  Cell.call(this, x, y, z, 8);
  this.top = top;

  this.getTranslations = function () {
    return this.top ? HexCell.topTranslations : HexCell.bottomTranslations;
  };

  this.getWallDirections = function () {
    return HexCell.wallDirections;
  };
}

HexCell.topTranslations = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
  [-1, 0, 0],
  [-1, 0, -1],
  [0, -1, 0],
  [0, 0, -1],
  [1, 0, -1]
];

HexCell.bottomTranslations = [
  [1, 0, 1],
  [0, 1, 0],
  [0, 0, 1],
  [-1, 0, 1],
  [-1, 0, 0],
  [0, -1, 0],
  [0, 0, -1],
  [1, 0, 0]
];

HexCell.wallDirections = [0, 6, 1, 2, 3, 7, 4, 5];

function OctCell(x, y, z) {
  Cell.call(this, x, y, z, 10);

  this.getTranslations = function () {
    return OctCell.translations;
  };

  this.getOpposite = function (direction) {
    return OctCell.opposites[direction];
  };

  this.getWallDirections = function () {
    return OctCell.wallDirections;
  };
}

OctCell.translations = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
  [-1, 0, 0],
  [0, -1, 0],
  [0, 0, -1],
  [1, 0, 1],
  [-1, 0, 1],
  [-1, 0, -1],
  [1, 0, -1]
];

OctCell.opposites = [3, 4, 5, 0, 1, 2, 8, 9, 6, 7];

OctCell.wallDirections = [0, 8, 2, 4, 9, 6, 1, 3, 5, 7];

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
    const neighbor = getNeighbor(cell, cell.getTranslation(i), grid);
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
    let current = grid["0,0," + z];
    while (current) {
      sets[k].push(current);
      const next = getNeighbor(current, current.getTranslation(0), grid);
      if ((isLastRow || Math.random() < horizontalBias) && current.x < xSize - 1) {
        if (currentRow.union(current, next)) {
          breakWall(current, next, 0);
        }
      } else {
        k++;
        sets[k] = [];
      }
      current = next;
    }
    if (!isLastRow) {
      for (let set of sets) {
        const index = Math.floor(Math.random() * set.length);
        for (let i = 0; i < set.length; i++) {
          if (i == index || Math.random() < (1 - horizontalBias) * (xSize - sets.length) / xSize) {
            const other = getNeighbor(set[i], set[i].getTranslation(1), grid);
            breakWall(set[i], other, 1);
            currentRow.universe.set(other, set[i]);
          }
        }
      }
      prevRow = currentRow;
    }
  }
}

function growingTree(grid) {
  const cells = Object.values(grid);
  const maze = [cells[Math.floor(Math.random() * cells.length)]];
  const visited = new Set(maze);
  while (maze.length > 0) {
    const random = Math.floor((1 - anchorBias) * Math.random() * maze.length + anchorBias * indexAnchor * (maze.length - 1));
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
    const other = getNeighbor(cell, cell.getTranslation(direction), grid);
    if (other && disjointSet.union(cell, other)) {
      breakWall(cell, other, direction);
    }
    walls.splice(random, 1);
  }
}

function nAryTree(grid) {
  for (let cell of Object.values(grid)) {
    let directions;
    switch (cell.constructor.name) {
      case "QuadCell":
        directions = [0, 1, 2];
        break;
      case "HexCell":
        directions = cell.top ? [0, 1, 2] : [0, 1, 2, 7];
        break;
      case "OctCell":
        directions = [0, 1, 2, 6];
        break;
    }
    while (directions.length > 0) {
      const random = Math.floor(Math.random() * directions.length);
      const direction = directions[random];
      const other = getNeighbor(cell, cell.getTranslation(direction), grid);
      if (other) {
        breakWall(cell, other, direction);
        break;
      }
      directions.splice(random, 1);
    }
  }
}

nAryTree.getSouthEasterns = function (cell) {
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
        const other = getNeighbor(cell, cell.getTranslation(direction), grid);
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
      if ((1 - horizontalBias) * width < horizontalBias * length || (width == length && Math.random() < horizontalBias)) {
        const path = x1 + Math.floor(Math.random() * width);
        const z = z1 + Math.floor((1 - anchorBias) * Math.random() * (length - 1) + anchorBias * indexAnchor * (length - 2));
        for (let x = x1; x < x1 + width; x++) {
          if (x != path) {
            const cell = grid[x + ",0," + z];
            breakWall(cell, getNeighbor(cell, cell.getTranslation(1), grid), 1, true);
          }
        }
        divide(x1, z1, width, z - z1 + 1);
        divide(x1, z + 1, width, length - (z - z1 + 1));
      } else {
        const path = z1 + Math.floor(Math.random() * length);
        const x = x1 + Math.floor((1 - anchorBias) * Math.random() * (width - 1) + anchorBias * indexAnchor * (width - 2));
        for (let z = z1; z < z1 + length; z++) {
          if (z != path) {
            const cell = grid[x + ",0," + z];
            breakWall(cell, getNeighbor(cell, cell.getTranslation(0), grid), 0, true);
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
  for (let z = 0; z < zSize; z++) {
    let run = [];
    current = grid["0,0," + z];
    while (current) {
      const next = getNeighbor(current, current.getTranslation(0), grid);
      run.push(current);
      if ((z == 0 || Math.random() < horizontalBias) && current.x < xSize - 1) {
        breakWall(current, next, 0);
      } else if (z > 0) {
        const cell = run[Math.floor(Math.random() * run.length)];
        breakWall(cell, getNeighbor(cell, current.getTranslation(3), grid), 3);
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
      const next = getNeighbor(current, current.getTranslation(direction), grid);
      breakWall(current, next, direction);
      current = next;
    }
  }
}

function generate() {
  algorithm = algorithmElem.value;
  cellShape = cellShapeElem.value;
  xSize = Math.max(1, parseInt(xSizeElem.value));
  ySize = ySizeElem.disabled ? 1 : Math.max(1, parseInt(ySizeElem.value));
  zSize = Math.max(1, parseInt(zSizeElem.value));
  horizontalBias = Math.min(1, parseFloat(horizontalBiasElem.value));
  indexAnchor = Math.min(1, parseFloat(indexAnchorElem.value));
  anchorBias = Math.min(1, parseFloat(anchorBiasElem.value));
  sideLength = Math.max(1, parseInt(sideLengthElem.value));
  thickness = Math.max(1, parseInt(thicknessElem.value));

  let gridHeight;
  switch (cellShape) {
    case "delta":
      this.createCell = function (x, y, z) {
        return new TriCell(x, y, z, !(x % 2 == 1 ^ z % 2 == 1));
      };
      gridHeight = zSize * sideLength * SQRT3 / 2;
      this.drawData = function (cell) {
        return [
          (cell.x + 1) * (sideLength / 2) + thickness,
          cell.upward ?
            cell.y * (gridHeight + sideLength) + (cell.z + 1) * sideLength * SQRT3 / 2 - sideLength / SQRT3 / 2 + thickness :
            cell.y * (gridHeight + sideLength) + cell.z * sideLength * SQRT3 / 2 + sideLength / SQRT3 / 2 + thickness,
          cell.upward ? Math.PI / 2 : Math.PI / 6
        ];
      };
      canvasElem.width = (xSize / 2 + 0.5) * sideLength + thickness * 2;
      break;
    case "orthogonal":
      this.createCell = function (x, y, z) {
        return new QuadCell(x, y, z);
      };
      gridHeight = zSize * sideLength;
      this.drawData = function (cell) {
        return [
          (cell.x + 0.5) * sideLength + thickness,
          cell.y * (gridHeight + sideLength) + (cell.z + 0.5) * sideLength + thickness,
          Math.PI / 4
        ];
      };
      canvasElem.width = xSize * sideLength + thickness * 2;
      break;
    case "sigma":
      this.createCell = function (x, y, z) {
        return new HexCell(x, y, z, x % 2 > 0);
      };
      gridHeight = (zSize + 0.5) * sideLength * SQRT3;
      this.drawData = function (cell) {
        return [
          (cell.x + (2 / 3)) * (1.5 * sideLength) + thickness,
          cell.y * (gridHeight + sideLength) + (cell.z + (cell.top ? 0.5 : 1)) * sideLength * SQRT3 + thickness,
          0
        ];
      };
      canvasElem.width = (xSize + 1 / 3) * sideLength * 1.5 + (thickness * 2);
      break;
    case "upsilon":
      this.createCell = function (x, y, z) {
        if (x % 2 == 1 ^ z % 2 == 1) {
          return new QuadCell(x, y, z);
        }
        return new OctCell(x, y, z);
      };
      gridHeight = zSize * (sideLength + sideLength / Math.SQRT2) + sideLength / Math.SQRT2;
      this.drawData = function (cell) {
        return [
          (cell.x + 0.5) * (sideLength + sideLength / Math.SQRT2) + sideLength / Math.SQRT2 / 2 + thickness,
          cell.y * (gridHeight + sideLength) + (cell.z + 0.5) * (sideLength + sideLength / Math.SQRT2) + sideLength / Math.SQRT2 / 2 + thickness,
          cell instanceof QuadCell ? Math.PI / 4 : Math.PI / 8
        ];
      };
      canvasElem.width = xSize * (sideLength + sideLength / Math.SQRT2) + sideLength / Math.SQRT2 + thickness * 2;
      break;
    case "zeta":
      this.createCell = function (x, y, z) {
        return new OctCell(x, y, z);
      };
      gridHeight = zSize * (sideLength + 2 * sideLength / Math.SQRT2);
      this.drawData = function (cell) {
        return [
          (cell.x + 0.5) * (sideLength + 2 * sideLength / Math.SQRT2) + thickness,
          cell.y * (gridHeight + sideLength) + (cell.z + 0.5) * (sideLength + 2 * sideLength / Math.SQRT2) + thickness,
          Math.PI / 8
        ];
      };
      canvasElem.width = xSize * (sideLength + 2 * sideLength / Math.SQRT2) + thickness * 2;
  }
  canvasElem.height = ySize * gridHeight + (ySize - 1) * sideLength + thickness * 2;

  let start = new Date().getTime();

  const grid = {};
  for (let x = 0; x < xSize; x++) {
    for (let y = 0; y < ySize; y++) {
      for (let z = 0; z < zSize; z++) {
        grid[x + "," + y + "," + z] = this.createCell(x, y, z);
      }
    }
  }

  eval(algorithm)(grid);

  const entries = document.getElementById("entries").value;
  let left, right;
  if (entries == "corners") {
    left = grid["0,0,0"];
    right = grid[(xSize - 1) + "," + (ySize - 1) + "," + (zSize - 1)];
  } else if (entries == "sides") {
    left = grid["0,0," + Math.floor(zSize / 2)];
    right = grid[(xSize - 1) + "," + (ySize - 1) + "," + Math.floor(zSize / 2)];
  }
  if (left) {
    switch (left.constructor.name) {
      case "HexCell":
        left.walls[3] = true;
        break;
      case "OctCell":
        left.walls[4] = true;
        break;
      default:
        left.walls[2] = true;
        break;
    }
    right.walls[0] = true;
  }

  console.log("Generation time: " + (new Date().getTime() - start));
  start = new Date().getTime();

  context.lineWidth = thickness;
  context.clearRect(0, 0, canvasElem.width, canvasElem.height);
  context.fillStyle = "#ffffff"
  context.beginPath();
  context.fillRect(0, 0, canvasElem.width, canvasElem.height);
  context.fill();
  context.strokeStyle = document.getElementById("wallColor").value;

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

  document.getElementById("download").style.display = "block";
}

function algorithmChange() {
  anchorBiasElem.disabled = true;
  cellShapeElem.disabled = false;
  cellShapeElem.options[0].disabled = false;
  horizontalBiasElem.disabled = true;
  indexAnchorElem.disabled = true;
  ySizeElem.disabled = false;
  switch (algorithmElem.value) {
    case "eller":
    case "sidewinder":
      cellShapeElem.disabled = true;
      horizontalBiasElem.disabled = false;
      ySizeElem.disabled = true;
      break;
    case "growingTree":
      anchorBiasElem.disabled = false;
      indexAnchorElem.disabled = false;
      break;
    case "nAryTree":
      cellShapeElem.options[0].disabled = true;
      break;
    case "recursiveDivision":
      anchorBiasElem.disabled = false;
      cellShapeElem.disabled = true;
      horizontalBiasElem.disabled = false;
      indexAnchorElem.disabled = false;
      ySizeElem.disabled = true;
  }
  if (cellShapeElem.disabled || (cellShapeElem.options[0].disabled && cellShapeElem.value == "delta")) {
    cellShapeElem.value = "orthogonal";
    cellShapeChange();
  }
  if (ySizeElem.disabled) {
    ySizeElem.value = 1;
  }
}

function cellShapeChange() {
}

function downloadMaze() {
  const image = canvasElem.toDataURL("maze/png");
  document.getElementById("download").href = image;
}
