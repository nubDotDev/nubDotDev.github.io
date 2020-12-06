const SQRT3 = Math.sqrt(3);

const algorithmElem = document.getElementById("algorithm");
const cellShapeElem = document.getElementById("cellShape");
const entriesElem = document.getElementById("entries");
const xSizeElem = document.getElementById("xSize");
const ySizeElem = document.getElementById("ySize");
const zSizeElem = document.getElementById("zSize");
const useCustomGridElem = document.getElementById("useCustomGrid");
const customGridElem = document.getElementById("customGrid");
const horizontalBiasElem = document.getElementById("horizontalBias");
const indexAnchorElem = document.getElementById("indexAnchor");
const anchorBiasElem = document.getElementById("anchorBias");
const canvasElem = document.getElementById("maze");

let horizontalBias, indexAnchor, anchorBias;

function Grid(xSize, ySize, zSize, cells = {}) {
  this.xSize = xSize;
  this.ySize = ySize;
  this.zSize = zSize;
  this.cells = cells;
}

Grid.prototype.getCell = function (x, y, z) {
  return this.cells[x + "," + y + "," + z];
}

Grid.prototype.getNeighbor = function (cell, direction) {
  const translation = cell.getTranslation(direction);
  return this.getCell(cell.x + translation[0], cell.y + translation[1], cell.z + translation[2]);
};

Grid.prototype.getNeighbors = function (cell, visited, inverse) {
  const neighbors = [];
  for (let i = 0; i < cell.wallCount; i++) {
    const neighbor = this.getNeighbor(cell, i);
    if (neighbor && (!inverse == (!visited || !visited.has(neighbor)))) {
      neighbors.push([neighbor, i]);
    }
  }
  return neighbors;
};

Grid.prototype.breakWall = function (cell, other, direction, build) {
  cell.walls[cell.getWallByDirection(direction)] = !build;
  other.walls[other.getWallByDirection(other.getOpposite(direction))] = !build;
};

Grid.prototype.draw = function (context, sideLength, thickness, wallColor, backgroundColor) {
  canvasElem.width = Math.ceil(this.xSize * this.cellWidth + this.xOffset + thickness);
  canvasElem.height = Math.ceil(this.ySize * (this.zSize * this.cellHeight + this.yOffset + sideLength) - sideLength + thickness);
  context.lineWidth = thickness;
  context.strokeStyle = wallColor;
  context.fillStyle = backgroundColor;
  context.clearRect(0, 0, canvasElem.width, canvasElem.height);
  context.fillRect(0, 0, canvasElem.width, canvasElem.height);
  for (let cell of Object.values(this.cells)) {
    let [centerX, centerY, angle] = this.getDrawData(cell, sideLength, thickness);
    const wall2dCount = cell.wallCount - 2;
    const radius = sideLength / Math.sin(Math.PI / wall2dCount) / 2;
    context.moveTo(centerX + Math.cos(angle) * radius, centerY - Math.sin(angle) * radius);
    for (let i = 0; i < wall2dCount; i++) {
      angle -= Math.PI * 2 / wall2dCount;
      const toFunction = (cell.walls[i] ? context.moveTo : context.lineTo).bind(context);
      toFunction(centerX + Math.cos(angle) * radius, centerY - Math.sin(angle) * radius);
    }
    if (cell.walls[wall2dCount]) {
      context.moveTo(centerX - radius / 3, centerY + radius / 3);
      context.lineTo(centerX + radius / 3, centerY - radius / 3)
    }
    if (cell.walls[wall2dCount + 1]) {
      context.moveTo(centerX - radius / 3, centerY - radius / 3);
      context.lineTo(centerX + radius / 3, centerY + radius / 3)
    }
  }
  context.stroke();
};

function DeltaGrid(xSize, ySize, zSize) {
  Grid.call(this, xSize, ySize, zSize);
}

DeltaGrid.prototype = Object.create(Grid.prototype);

DeltaGrid.prototype.createCell = function (x, y, z) {
  return new TriCell(x, y, z, !(x % 2 == 1 ^ z % 2 == 1));
};

DeltaGrid.prototype.getDrawData = function (cell, sideLength, thickness) {
  return [
    (cell.x + 1) * this.cellWidth + thickness / 2,
    cell.y * (this.zSize * this.cellHeight + sideLength) + cell.z * this.cellHeight + (cell.isUpward ? 2 : 1) * sideLength / SQRT3 / 2 + thickness / 2,
    cell.isUpward ? Math.PI / 2 : Math.PI / 6
  ];
};

DeltaGrid.prototype.draw = function (canvasElem, sideLength, thickness, wallColor, backgroundColor) {
  this.cellWidth = sideLength / 2;
  this.cellHeight = sideLength * SQRT3 / 2;
  this.xOffset = this.cellWidth;
  this.yOffset = 0;
  Grid.prototype.draw.call(this, canvasElem.getContext("2d"), sideLength, thickness, wallColor, backgroundColor);
};

function OrthogonalGrid(xSize, ySize, zSize) {
  Grid.call(this, xSize, ySize, zSize);
}

OrthogonalGrid.prototype = Object.create(Grid.prototype);

OrthogonalGrid.prototype.createCell = function (x, y, z) {
  return new QuadCell(x, y, z);
};

OrthogonalGrid.prototype.getDrawData = function (cell, sideLength, thickness) {
  return [
    (cell.x + 0.5) * sideLength + thickness / 2,
    cell.y * (this.zSize * this.cellHeight + sideLength) + (cell.z + 0.5) * this.cellHeight + thickness / 2,
    Math.PI / 4
  ];
};

OrthogonalGrid.prototype.draw = function (canvasElem, sideLength, thickness, wallColor, backgroundColor) {
  this.cellWidth = sideLength;
  this.cellHeight = sideLength;
  this.xOffset = 0;
  this.yOffset = 0;
  Grid.prototype.draw.call(this, canvasElem.getContext("2d"), sideLength, thickness, wallColor, backgroundColor);
};

function SigmaGrid(xSize, ySize, zSize) {
  Grid.call(this, xSize, ySize, zSize);
}

SigmaGrid.prototype = Object.create(Grid.prototype);

SigmaGrid.prototype.createCell = function (x, y, z) {
  return new HexCell(x, y, z, x % 2 == 1);
};

SigmaGrid.prototype.getDrawData = function (cell, sideLength, thickness) {
  return [
    (cell.x + 2 / 3) * this.cellWidth + thickness / 2,
    cell.y * (this.zSize * this.cellHeight + sideLength) + (cell.z + (cell.isTop ? 0.5 : 1)) * this.cellHeight + thickness / 2,
    0
  ];
};

SigmaGrid.prototype.draw = function (canvasElem, sideLength, thickness, wallColor, backgroundColor) {
  this.cellWidth = sideLength * 1.5;
  this.cellHeight = sideLength * SQRT3;
  this.xOffset = this.cellWidth / 3;
  this.yOffset = this.cellHeight / 2;
  Grid.prototype.draw.call(this, canvasElem.getContext("2d"), sideLength, thickness, wallColor, backgroundColor);
};

function UpsilonGrid(xSize, ySize, zSize) {
  Grid.call(this, xSize, ySize, zSize);
}

UpsilonGrid.prototype = Object.create(Grid.prototype);

UpsilonGrid.prototype.createCell = function (x, y, z) {
  return x % 2 == 1 ^ z % 2 == 1 ? new QuadCell(x, y, z) : new OctCell(x, y, z);
};

UpsilonGrid.prototype.getDrawData = function (cell, sideLength, thickness) {
  return [
    (cell.x + 0.5) * this.cellWidth + this.xOffset / 2 + thickness / 2,
    cell.y * (this.zSize * this.cellHeight + sideLength) + (cell.z + 0.5) * this.cellHeight + this.yOffset / 2 + thickness / 2,
    cell instanceof QuadCell ? Math.PI / 4 : Math.PI / 8
  ];
};

UpsilonGrid.prototype.draw = function (canvasElem, sideLength, thickness, wallColor, backgroundColor) {
  this.cellWidth = sideLength + sideLength / Math.SQRT2;
  this.cellHeight = sideLength + sideLength / Math.SQRT2;
  this.xOffset = sideLength / Math.SQRT2;
  this.yOffset = sideLength / Math.SQRT2;
  Grid.prototype.draw.call(this, canvasElem.getContext("2d"), sideLength, thickness, wallColor, backgroundColor);
};

function ZetaGrid(xSize, ySize, zSize) {
  Grid.call(this, xSize, ySize, zSize);
}

ZetaGrid.prototype = Object.create(Grid.prototype);

ZetaGrid.prototype.createCell = function (x, y, z) {
  return new OctCell(x, y, z);
};

ZetaGrid.prototype.getNeighbor = function (cell, direction) {
  const neighbor = Grid.prototype.getNeighbor.call(this, cell, direction);
  if (direction > 5) {
    const adjacent = this.getNeighbor(cell, direction > 7 ? 5 : 2);
    const perpendicular = -2 * direction + 19;
    if (adjacent && adjacent.walls[perpendicular]) {
      return;
    }
  }
  return neighbor;
};

ZetaGrid.prototype.getDrawData = function (cell, sideLength, thickness) {
  return [
    (cell.x + 0.5) * this.cellWidth + thickness / 2,
    cell.y * (this.zSize * this.cellHeight + sideLength) + (cell.z + 0.5) * this.cellHeight + thickness / 2,
    Math.PI / 8
  ];
};

ZetaGrid.prototype.draw = function (canvasElem, sideLength, thickness, wallColor, backgroundColor) {
  this.cellWidth = Math.ceil(sideLength + 2 * sideLength / Math.SQRT2);
  this.cellHeight = Math.ceil(sideLength + 2 * sideLength / Math.SQRT2);
  this.xOffset = 0;
  this.yOffset = 0;
  const context = canvasElem.getContext("2d");
  canvasElem.width = this.xSize * this.cellWidth + this.xOffset + thickness;
  canvasElem.height = this.ySize * (this.zSize * this.cellHeight + this.yOffset + sideLength) - sideLength + thickness;
  context.lineWidth = thickness;
  context.strokeStyle = wallColor;
  context.fillStyle = backgroundColor;
  context.clearRect(0, 0, canvasElem.width, canvasElem.height);
  context.fillRect(0, 0, canvasElem.width, canvasElem.height);
  for (let cell of Object.values(this.cells)) {
    let [centerX, centerY, angle] = this.getDrawData(cell, sideLength, thickness);
    const wall2dCount = cell.wallCount - 2;
    const radius = sideLength / Math.sin(Math.PI / wall2dCount) / 2;
    context.moveTo(centerX + Math.cos(angle) * radius, centerY - Math.sin(angle) * radius);
    for (let i = 0; i < wall2dCount; i++) {
      const toFunction = (cell.walls[i] ? context.moveTo : context.lineTo).bind(context);
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const direction = cell.getWallDirections().indexOf(i);
      const translation = cell.getTranslation(direction);
      if (i % 2 == 1) {
        const leftNeighbor = this.getNeighbor(cell, cell.getWallDirections().indexOf((cell.getWallByDirection(direction) + 7) % 8));
        if (cell.walls[i]) {
          if (!leftNeighbor) {
            context.lineTo(centerX + cos * radius + (cos > 0 ? 1 : -1) * sideLength / Math.SQRT2, centerY - sin * radius + (sin > 0 ? -1 : 1) * sideLength / Math.SQRT2);
          }
        } else {
          const rightNeighbor = this.getNeighbor(cell, cell.getWallDirections().indexOf((cell.getWallByDirection(direction) + 1) % 8));
          if (this.getNeighbor(cell, direction) ||
            (!this.getCell(cell.x + translation[0], cell.y + translation[1], cell.z + translation[2]) &&
              ((!leftNeighbor || !leftNeighbor.walls[(leftNeighbor.getWallByDirection(direction) + 2) % 8]) ||
                !rightNeighbor || !rightNeighbor.walls[(rightNeighbor.getWallByDirection(direction) + 6) % 8]))) {
            if (Math.abs(cos) > Math.abs(sin)) {
              toFunction(centerX + cos * radius, centerY - (sin > 0 ^ cos > 0 ? -1 : 1) * cos * radius);
            } else {
              toFunction(centerX + (sin > 0 ^ cos > 0 ? -1 : 1) * sin * radius, centerY - sin * radius);
            }
          }
        }
      }
      angle -= Math.PI * 2 / wall2dCount;
      toFunction(centerX + Math.cos(angle) * radius, centerY - Math.sin(angle) * radius);
    }
    if (cell.walls[wall2dCount]) {
      context.moveTo(centerX - radius / 3, centerY + radius / 3);
      context.lineTo(centerX + radius / 3, centerY - radius / 3)
    }
    if (cell.walls[wall2dCount + 1]) {
      context.moveTo(centerX - radius / 3, centerY - radius / 3);
      context.lineTo(centerX + radius / 3, centerY + radius / 3)
    }
  }
  context.stroke();
};

function createEmptyGrid(xSize, ySize, zSize, cellShape) {
  switch (cellShape) {
    case "delta":
      return new DeltaGrid(xSize, ySize, zSize);
    case "orthogonal":
      return new OrthogonalGrid(xSize, ySize, zSize);
    case "sigma":
      return new SigmaGrid(xSize, ySize, zSize);
    case "upsilon":
      return new UpsilonGrid(xSize, ySize, zSize);
    case "zeta":
      return new ZetaGrid(xSize, ySize, zSize);
  }
}

function createGrid(xSize, ySize, zSize, cellShape, customGrid) {
  const grid = createEmptyGrid(xSize, ySize, zSize, cellShape);
  if (customGrid) {
    const coordChecker = math.compile(customGrid);
    for (let x = 0; x < xSize; x++) {
      for (let y = 0; y < ySize; y++) {
        for (let z = 0; z < zSize; z++) {
          if (coordChecker.evaluate({ w: xSize, h: ySize, l: zSize, x: x, y: y, z: z })) {
            grid.cells[x + "," + y + "," + z] = grid.createCell(x, y, z);
          }
        }
      }
    }
    const cells = Object.values(grid.cells);
    const queue = [cells[0]];
    const visited = new Set();
    while (queue.length > 0) {
      const current = queue.pop();
      if (!visited.has(current)) {
        visited.add(current);
        for (let [next] of grid.getNeighbors(current)) {
          queue.push(next);
        }
      }
    }
    if (visited.size == cells.length) {
      return grid;
    }
  }
  for (let x = 0; x < xSize; x++) {
    for (let y = 0; y < ySize; y++) {
      for (let z = 0; z < zSize; z++) {
        if (!grid.getCell(x, y, z)) {
          grid.cells[x + "," + y + "," + z] = grid.createCell(x, y, z);
        }
      }
    }
  }
  return grid;
}

function Cell(x, y, z, wallCount) {
  this.x = x;
  this.y = y;
  this.z = z;
  this.wallCount = wallCount;
  this.walls = [];
  for (i = 0; i < wallCount; i++) {
    this.walls[i] = false;
  }
}

Cell.prototype.getTranslations = function () { };

Cell.prototype.getTranslation = function (direction) {
  return this.getTranslations()[direction];
};

Cell.prototype.getOpposite = function (direction) {
  return (direction + (this.wallCount / 2)) % this.wallCount;
};

Cell.prototype.getWallDirections = function () { };

Cell.prototype.getWallByDirection = function (direction) {
  return this.getWallDirections()[direction];
};

function TriCell(x, y, z, isUpward) {
  Cell.call(this, x, y, z, 5);
  this.isUpward = isUpward;
}

TriCell.prototype = Object.create(Cell.prototype);

TriCell.prototype.getTranslations = function () {
  return this.isUpward ? TriCell.upwardTranslations : TriCell.downwardTranslations;
};

TriCell.prototype.getOpposite = function (direction) {
  return -1 * (direction - 2) + 2;
};

TriCell.prototype.getWallDirections = function () {
  return this.isUpward ? TriCell.upwardWallDirections : TriCell.downwardWallDirections;
};

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
}

QuadCell.prototype = Object.create(Cell.prototype);

QuadCell.prototype.getTranslations = function () {
  return QuadCell.translations;
};

QuadCell.prototype.getWallDirections = function () {
  return QuadCell.wallDirections;
};

QuadCell.translations = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
  [-1, 0, 0],
  [0, -1, 0],
  [0, 0, -1]
];

QuadCell.wallDirections = [0, 4, 1, 2, 5, 3];

function HexCell(x, y, z, isTop) {
  Cell.call(this, x, y, z, 8);
  this.isTop = isTop;
}

HexCell.prototype = Object.create(Cell.prototype);

HexCell.prototype.getTranslations = function () {
  return this.isTop ? HexCell.topTranslations : HexCell.bottomTranslations;
};

HexCell.prototype.getWallDirections = function () {
  return HexCell.wallDirections;
};

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
}

OctCell.prototype = Object.create(Cell.prototype);

OctCell.prototype.getTranslations = function () {
  return OctCell.translations;
};

OctCell.prototype.getOpposite = function (direction) {
  return OctCell.opposites[direction];
};

OctCell.prototype.getWallDirections = function () {
  return OctCell.wallDirections;
};

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
}

DisjointSet.prototype.addSet = function (set) {
  this.universe.set(set, set);
}

DisjointSet.prototype.find = function (set) {
  if (set == this.universe.get(set)) {
    return set;
  }
  const root = this.find(this.universe.get(set));
  this.universe.set(set, root);
  return root;
}

DisjointSet.prototype.union = function (set1, set2) {
  root1 = this.find(set1);
  root2 = this.find(set2);
  if (root1 != root2) {
    this.universe.set(root2, root1);
    return true;
  }
  return false;
}

function aldousBroder(grid) {
  const cells = Object.values(grid.cells);
  let current = cells[Math.floor(Math.random() * cells.length)];
  const visited = new Set([current]);
  while (visited.size < cells.length) {
    const neighbors = grid.getNeighbors(current);
    const [next, direction] = neighbors[Math.floor(Math.random() * neighbors.length)];
    if (!visited.has(next)) {
      grid.breakWall(current, next, direction);
      visited.add(next);
    }
    current = next;
  }
}

function eller(grid) {
  let prevRow = new DisjointSet();
  for (let z = 0; z < grid.zSize; z++) {
    const currentRow = new DisjointSet();
    for (let x = 0; x < grid.xSize; x++) {
      const cell = grid.getCell(x, 0, z);
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
    const isLastRow = z == grid.zSize - 1;
    let current = grid.getCell(0, 0, z);
    while (current) {
      sets[k].push(current);
      const next = grid.getNeighbor(current, 0);
      if ((isLastRow || Math.random() < horizontalBias) && current.x < grid.xSize - 1) {
        if (currentRow.union(current, next)) {
          grid.breakWall(current, next, 0);
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
          if (i == index || Math.random() < (1 - horizontalBias) * (grid.xSize - sets.length) / grid.xSize) {
            const other = grid.getNeighbor(set[i], 2);
            grid.breakWall(set[i], other, 2);
            currentRow.universe.set(other, set[i]);
          }
        }
      }
      prevRow = currentRow;
    }
  }
}

function growingTree(grid) {
  const cells = Object.values(grid.cells);
  const maze = [cells[Math.floor(Math.random() * cells.length)]];
  const visited = new Set(maze);
  while (maze.length > 0) {
    const random = Math.floor((1 - anchorBias) * Math.random() * maze.length + anchorBias * indexAnchor * (maze.length - 1));
    const cell = maze[random];
    const neighbors = grid.getNeighbors(cell, visited);
    if (neighbors.length == 0) {
      maze.splice(random, 1);
    } else {
      const [next, direction] = neighbors[Math.floor(Math.random() * neighbors.length)];
      grid.breakWall(cell, next, direction);
      maze.push(next);
      visited.add(next);
    }
  }
}

function huntAndKill(grid) {
  const cells = Object.values(grid.cells);
  let current = cells[Math.floor(Math.random() * cells.length)];
  const visited = new Set([current]);
  while (visited.size < cells.length) {
    const neighbors = grid.getNeighbors(current, visited);
    if (neighbors.length > 0) {
      const [next, direction] = neighbors[Math.floor(Math.random() * neighbors.length)];
      grid.breakWall(current, next, direction);
      current = next;
      visited.add(current);
    } else {
      for (let cell of cells) {
        if (!visited.has(cell)) {
          const neighbors = grid.getNeighbors(cell, visited, true);
          if (neighbors.length > 0) {
            const [other, direction] = neighbors[Math.floor(Math.random() * neighbors.length)];
            grid.breakWall(cell, other, direction);
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
  for (let cell of Object.values(grid.cells)) {
    disjointSet.addSet(cell);
    for (let direction = 0; direction < cell.wallCount; direction++) {
      walls.push([cell, direction]);
    }
  }
  while (walls.length > 0) {
    const random = Math.floor(Math.random() * walls.length);
    const [cell, direction] = walls[random];
    const other = grid.getNeighbor(cell, direction);
    if (other && disjointSet.union(cell, other)) {
      grid.breakWall(cell, other, direction);
    }
    walls.splice(random, 1);
  }
}

function nAryTree(grid) {
  for (let cell of Object.values(grid.cells)) {
    let directions;
    if (cell instanceof QuadCell) {
      directions = [0, 1, 2];
    } else if (cell instanceof HexCell) {
      directions = cell.isTop ? [0, 1, 2] : [0, 1, 2, 7];
    } else if (cell instanceof OctCell) {
      directions = [0, 1, 2, 6];
    }
    while (directions.length > 0) {
      const random = Math.floor(Math.random() * directions.length);
      const direction = directions[random];
      const other = grid.getNeighbor(cell, direction);
      if (other) {
        grid.breakWall(cell, other, direction);
        break;
      }
      directions.splice(random, 1);
    }
  }
}

function prim(grid) {
  const cells = Object.values(grid.cells);
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
        const other = grid.getNeighbor(cell, direction);
        if (other && !visited.has(other)) {
          grid.breakWall(cell, other, direction);
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
  const cells = Object.values(grid.cells);
  let current = cells[Math.floor(Math.random() * cells.length)];
  const visited = new Set([current]);
  const backtrack = [];
  while (visited.size < cells.length) {
    const neighbors = grid.getNeighbors(current, visited);
    if (neighbors.length > 0) {
      const [next, direction] = neighbors[Math.floor(Math.random() * neighbors.length)];
      grid.breakWall(current, next, direction);
      backtrack.push(current);
      current = next;
      visited.add(current);
    } else {
      current = backtrack.pop();
    }
  }
}

function recursiveDivision(grid) {
  for (let cell of Object.values(grid.cells)) {
    cell.walls[0] = cell.x < grid.xSize - 1;
    cell.walls[1] = cell.z < grid.zSize - 1;
    cell.walls[2] = cell.x > 0;
    cell.walls[3] = cell.z > 0;
  }

  const divide = function (x1, z1, width, length) {
    if (width > 1 && length > 1) {
      if ((1 - horizontalBias) * width < horizontalBias * length || (width == length && Math.random() < horizontalBias)) {
        const path = x1 + Math.floor(Math.random() * width);
        const z = z1 + Math.floor((1 - anchorBias) * Math.random() * (length - 1) + anchorBias * indexAnchor * (length - 2));
        for (let x = x1; x < x1 + width; x++) {
          if (x != path) {
            const cell = grid.getCell(x, 0, z);
            grid.breakWall(cell, grid.getNeighbor(cell, 2), 2, true);
          }
        }
        divide(x1, z1, width, z - z1 + 1);
        divide(x1, z + 1, width, length - (z - z1 + 1));
      } else {
        const path = z1 + Math.floor(Math.random() * length);
        const x = x1 + Math.floor((1 - anchorBias) * Math.random() * (width - 1) + anchorBias * indexAnchor * (width - 2));
        for (let z = z1; z < z1 + length; z++) {
          if (z != path) {
            const cell = grid.getCell(x, 0, z);
            grid.breakWall(cell, grid.getNeighbor(cell, 0), 0, true);
          }
        }
        divide(x1, z1, x - x1 + 1, length);
        divide(x + 1, z1, width - (x - x1 + 1), length);
      }
    }
  }

  divide(0, 0, grid.xSize, grid.zSize);
}

function sidewinder(grid) {
  for (let z = 0; z < grid.zSize; z++) {
    let run = [];
    current = grid.getCell(0, 0, z);
    while (current) {
      const next = grid.getNeighbor(current, 0);
      run.push(current);
      if ((z == 0 || Math.random() < horizontalBias) && current.x < grid.xSize - 1) {
        grid.breakWall(current, next, 0);
      } else if (z > 0) {
        const cell = run[Math.floor(Math.random() * run.length)];
        grid.breakWall(cell, grid.getNeighbor(cell, 5), 5);
        run = [];
      }
      current = next;
    }
  }
}

function wilson(grid) {
  const cells = Object.values(grid.cells);
  const notMaze = new Set(cells);
  notMaze.delete(cells[Math.floor(Math.random() * cells.length)]);
  while (notMaze.size > 0) {
    const run = new WeakMap();
    const start = cells[Math.floor(Math.random() * cells.length)];
    let current = start;
    while (notMaze.has(current)) {
      const neighbors = grid.getNeighbors(current);
      const [next, direction] = neighbors[Math.floor(Math.random() * neighbors.length)];
      run.set(current, direction);
      current = next;
    }
    current = start;
    while (notMaze.has(current)) {
      notMaze.delete(current);
      const direction = run.get(current);
      const next = grid.getNeighbor(current, direction);
      grid.breakWall(current, next, direction);
      current = next;
    }
  }
}

function breakEntries(grid, entries = "corners") {
  if (entries != "none") {
    let left, right;
    if (entries == "corners") {
      left = grid.getCell(0, 0, 0);
      right = grid.getCell(grid.xSize - 1, 0, grid.zSize - 1);
    } else if (entries == "sides") {
      left = grid.getCell(0, 0, Math.floor(grid.zSize / 2));
      right = grid.getCell(grid.xSize - 1, 0, Math.floor(grid.zSize / 2));
    }
    if (left && right) {
      if (left instanceof HexCell) {
        left.walls[3] = true;
      } else if (left instanceof OctCell) {
        left.walls[4] = true;
      } else {
        left.walls[2] = true;
      }
      right.walls[0] = true;
    }
  }
}

function generate() {
  const xSize = Math.max(1, parseInt(xSizeElem.value));
  const ySize = ySizeElem.disabled ? 1 : Math.max(1, parseInt(ySizeElem.value));
  const zSize = Math.max(1, parseInt(zSizeElem.value));
  horizontalBias = Math.min(1, parseFloat(horizontalBiasElem.value));
  indexAnchor = Math.min(1, parseFloat(indexAnchorElem.value));
  anchorBias = Math.min(1, parseFloat(anchorBiasElem.value));

  let start = new Date().getTime();

  const grid = createGrid(xSize, ySize, zSize, cellShapeElem.value, useCustomGridElem.checked ? customGridElem.value : undefined);
  eval(algorithmElem.value)(grid);
  breakEntries(grid, entriesElem.value);

  console.log("Generation time: " + (new Date().getTime() - start));
  start = new Date().getTime();

  grid.draw(
    canvasElem,
    Math.max(1, parseInt(document.getElementById("sideLength").value)),
    Math.max(1, parseInt(document.getElementById("lineThickness").value)),
    document.getElementById("wallColor").value,
    document.getElementById("backgroundColor").value
  );

  console.log("Draw time: " + (new Date().getTime() - start));
  document.getElementById("download").style.display = "block";
}

const elemFlags = {
  CELL_SHAPE: 1,
  ALGORITHM: 2,
  ENTRIES: 4,
  WIDTH: 8,
  LENGTH: 16,
  HEIGHT: 32,
  CUSTOM_GRID: 64,
  HORIZONTAL_BIAS: 128,
  ANCHOR: 256
};

const cellShapeFlags = {
  DELTA: 1,
  ORTHOGONAL: 2,
  SIGMA: 4,
  UPSILON: 8,
  ZETA: 16
};

function algorithmChange() {
  let disableElems = elemFlags.HORIZONTAL_BIAS | elemFlags.ANCHOR;
  let disableCellShapes = 0;
  switch (algorithmElem.value) {
    case "eller":
    case "sidewinder":
      disableElems = elemFlags.CELL_SHAPE | elemFlags.HEIGHT | elemFlags.CUSTOM_GRID | elemFlags.ANCHOR;
      break;
    case "growingTree":
      disableElems = elemFlags.CUSTOM_GRID | elemFlags.HORIZONTAL_BIAS;
      break;
    case "nAryTree":
      disableElems = elemFlags.CUSTOM_GRID | elemFlags.HORIZONTAL_BIAS | elemFlags.ANCHOR;
      disableCellShapes = cellShapeFlags.DELTA;
      break;
    case "recursiveDivision":
      disableElems = elemFlags.CELL_SHAPE | elemFlags.HEIGHT | elemFlags.CUSTOM_GRID;
      break;
    case "wilson":
      disableCellShapes = cellShapeFlags.ZETA;
      break;
  }
  cellShapeElem.disabled = disableElems & elemFlags.CELL_SHAPE;
  algorithmElem.disabled = disableElems & elemFlags.ALGORITHM;
  entriesElem.disabled = disableElems & elemFlags.ENTRIES;
  xSizeElem.disabled = disableElems & elemFlags.WIDTH;
  zSizeElem.disabled = disableElems & elemFlags.LENGTH;
  ySizeElem.disabled = disableElems & elemFlags.HEIGHT;
  useCustomGridElem.disabled = disableElems & elemFlags.CUSTOM_GRID;
  horizontalBiasElem.disabled = disableElems & elemFlags.HORIZONTAL_BIAS;
  indexAnchorElem.disabled = disableElems & elemFlags.ANCHOR;
  anchorBiasElem.disabled = disableElems & elemFlags.ANCHOR;
  for (let i = 0; i < cellShapeElem.options.length; i++) {
    cellShapeElem.options[i].disabled = disableCellShapes & (2 ** i);
  }
  if (cellShapeElem.disabled || (cellShapeElem.options[cellShapeElem.selectedIndex].disabled)) {
    cellShapeElem.value = "orthogonal";
  }
  if (ySizeElem.disabled) {
    ySizeElem.value = 1;
  }
  if (useCustomGridElem.disabled) {
    useCustomGridElem.checked = false;
    useCustomGridChange();
  }
}

function useCustomGridChange() {
  customGridElem.disabled = !useCustomGridElem.checked;
}

function downloadMaze() {
  const image = canvasElem.toDataURL("maze/png");
  document.getElementById("download").href = image;
}
