import * as consts from "consts";

export interface BoardListener {
    setCell(row: number, col: number, cellValue: integer): void,
    deleteCell(fancy: boolean, row: number, col: number): void,
    moveCell(srcRow: number, srcCol: number, rowChange: number, colChange: number): void,
}

export interface Board {
    gridGet(row: number, col: number): integer,
    gridSet(row: number, col: number, cellValue: integer): void,
    gridMove(row: number, col: number, rowChange: number, colChange: number): void,
    gridDelete(fancy: boolean, row: number, col: number): integer,
    numGridRows(): number,
    numGridCols(): number,
    // Returns sets of cells to clear from the board (but doesn't clear them itself).
    // Only settled cells are considered for clearing.
    getCellsToClear(): [integer, integer][][],
    cellsActiveCanMove(posRow: number, posCol: number, rotation: number): boolean,
    sameType(cell: integer, ...cells: integer[]): boolean,
    canPlaceTarget(row: number, col: number, cell: integer): boolean,
}

/**
 * Contains the actual game logic and state.
 * 
 * It is not responsible for the graphics, sound, controls, or even the rate
 * the game runs at.
 * 
 * It provides an interface for setting up the game board, receiving control
 * events (shift active piece left, right, shove, cw/ccw rotate, receive garbage)
 * sending game events (piece moved/rotated/got-set, game lost/won, etc), and
 * querying the game status.
 */
export class GameBoard implements Board {
    gridRows;
    gridCols;
    grid: integer[];
    listener: BoardListener | null = null;

    constructor(rows: number, cols: number) {
        this.gridRows = rows;
        this.gridCols = cols;
        this.grid = Array(this.gridRows * this.gridCols);
        for (let i = 0; i < this.grid.length; ++i) {
            this.grid[i] = consts.CELL_EMPTY;
        }
    }

    setListener(listener: BoardListener) {
        this.listener = listener;
    }

    numGridRows(): number {
        return this.gridRows;
    }

    numGridCols(): number {
        return this.gridCols;
    }

    gridIndex(row: number, col: number): number {
        return row * this.gridCols + col;
    }

    gridGet(row: number, col: number): integer {
        return this.grid[this.gridIndex(row, col)];
    }

    #internalGridSet(row: number, col: number, cellValue: integer): integer {
        let index = this.gridIndex(row, col);
        let oldCell = this.grid[index];
        if (oldCell != cellValue) {
            this.grid[index] = cellValue;
        }

        return oldCell;
    }

    gridSet(row: number, col: number, cellValue: integer): integer {
        let oldCell = this.#internalGridSet(row, col, cellValue);
        if (oldCell != cellValue) {
            this.listener?.setCell(row, col, cellValue);
        }

        return oldCell;
    }

    gridMove(row: number, col: number, rowChange: number, colChange: number): integer {
        let sourceIndex = this.gridIndex(row, col);
        let targetIndex = this.gridIndex(row + rowChange, col + colChange);
        let sourceCell = this.grid[sourceIndex];
        let oldTargetCell = this.grid[targetIndex];
        this.grid[targetIndex] = sourceCell;
        this.grid[sourceIndex] = consts.CELL_EMPTY;
        this.listener?.moveCell(row, col, rowChange, colChange);

        return oldTargetCell;
    }

    // Deletes the cell at the location, and "unjoins" any cells joined to that cell.
    gridDelete(fancy: boolean, row: number, col: number): integer {
        let old = this.gridGet(row, col);
        // If cell is connected above, remove that cell's respective join.
        if ((old & consts.CELL_JOINED_TOP) != 0) {
            this.gridSet(row + 1, col, this.gridGet(row + 1, col) & ~consts.CELL_JOINED_BOTTOM);
        }
        // If cell is connected right, remove that cell's respective join.
        if ((old & consts.CELL_JOINED_RIGHT) != 0) {
            this.gridSet(row, col + 1, this.gridGet(row, col + 1) & ~consts.CELL_JOINED_LEFT);
        }
        // If cell is connected below, remove that cell's respective join.
        if ((old & consts.CELL_JOINED_BOTTOM) != 0) {
            this.gridSet(row - 1, col, this.gridGet(row - 1, col) & ~consts.CELL_JOINED_TOP);
        }
        // If cell is connected left, remove that cell's respective join.
        if ((old & consts.CELL_JOINED_LEFT) != 0) {
            this.gridSet(row, col - 1, this.gridGet(row, col - 1) & ~consts.CELL_JOINED_RIGHT);
        }

        this.#internalGridSet(row, col, consts.CELL_EMPTY);
        this.listener?.deleteCell(fancy, row, col);

        return old;
    }

    // Returns sets of cells to clear from the board (but doesn't clear them itself).
    // Only settled cells are considered for clearing.
    getCellsToClear(): [integer, integer][][] {
        let setsToClear: [integer, integer][][] = [];
        // Find any horizontal clears
        for (let row = 0; row < this.gridRows; ++row) {
            let seriesType = 0;
            let seriesLength = 0;
            for (let col = 0; col < this.gridCols; ++col) {
                let cell = this.gridGet(row, col);
                let currType = cell & consts.CELL_TYPE_MASK;
                if (currType == seriesType) {
                    ++seriesLength;
                } else {
                    // If series is long enough, add cols to clear
                    if (seriesType != 0 && seriesLength >= 4) {
                        let cellsToClear: [integer, integer][] = [];
                        for (let i = col - seriesLength; i < col; ++i) {
                            cellsToClear.push([row, i]);
                        }
                        setsToClear.push(cellsToClear);
                    }

                    seriesType = currType;
                    seriesLength = 1;
                }
            }
            // Must check at end of each row if there is a series long enough to clear.
            // If series is long enough, add cols to clear
            if (seriesType != 0 && seriesLength >= 4) {
                let cellsToClear: [integer, integer][] = [];
                for (let i = this.gridCols - seriesLength; i < this.gridCols; ++i) {
                    cellsToClear.push([row, i]);
                }
                setsToClear.push(cellsToClear);
            }
        }

        // Find any vertical clears
        for (let col = 0; col < this.gridCols; ++col) {
            let seriesType = 0;
            let seriesLength = 0;
            for (let row = 0; row < this.gridRows; ++row) {
                let cell = this.gridGet(row, col);
                let currType = cell & consts.CELL_TYPE_MASK;
                if (currType == seriesType) {
                    ++seriesLength;
                } else {
                    // If series is long enough, add rows to clear
                    if (seriesType != 0 && seriesLength >= 4) {
                        let cellsToClear: [integer, integer][] = [];
                        for (let i = row - seriesLength; i < row; ++i) {
                            cellsToClear.push([i, col]);
                        }
                        setsToClear.push(cellsToClear);
                    }

                    seriesType = currType;
                    seriesLength = 1;
                }
            }
            // Must check at end of each col if there is a series long enough to clear.
            // If series is long enough, add rows to clear
            if (seriesType != 0 && seriesLength >= 4) {
                let cellsToClear: [integer, integer][] = [];
                for (let i = this.gridRows - seriesLength; i < this.gridRows; ++i) {
                    cellsToClear.push([i, col]);
                }
                setsToClear.push(cellsToClear);
            }
        }
        return setsToClear;
    }

    cellsActiveCanMove(posRow: number, posCol: number, rotation: number): boolean {
        // NOTE: It may be possible to rotate if the active cells can shift left one

        let legit = true;

        // If horizontal, check at pos and to the right.
        if (rotation % 2 == 0) {
            legit = legit && (posRow >= 0) && (posRow <= this.gridRows - 1)
                && (posCol >= 0) && (posCol <= this.gridCols - 2);
            legit = legit
                && this.grid[(posRow * this.gridCols) + posCol] == consts.CELL_EMPTY
                && this.grid[(posRow * this.gridCols) + posCol + 1] == consts.CELL_EMPTY;
        } else {
            // If vertical, check at pos and above.
            legit = legit && (posRow >= 0) && (posRow <= this.gridRows - 2)
                && (posCol >= 0) && (posCol <= this.gridCols - 1);
            legit = legit
                && this.grid[(posRow * this.gridCols) + posCol] == consts.CELL_EMPTY
                && this.grid[((posRow + 1) * this.gridCols) + posCol] == consts.CELL_EMPTY;
        }

        return legit;
    }

    sameType(cell: integer, ...cells: integer[]): boolean {
        return cells.every(c => (c & consts.CELL_TYPE_MASK) == (cell & consts.CELL_TYPE_MASK));
    }

    canPlaceTarget(row: number, col: number, cell: integer): boolean {
        // If the placement would collide with a filled cell, then the answer is no.
        if (this.gridGet(row, col) != consts.CELL_EMPTY) {
            return false;
        }

        // If the placement results in three or more consecutive targets of the same type, then
        // it cannot be placed there.
        let cellType = cell & consts.CELL_TYPE_MASK;

        // If two cells left...
        if (col >= 2 && this.sameType(this.gridGet(row, col - 2), this.gridGet(row, col - 1), cellType)) {
            return false;
        }

        // If one cell left and one cell right...
        if (col >= 1 && col <= this.gridCols - 2 && this.sameType(this.gridGet(row, col - 1), cellType, this.gridGet(row, col + 1))) {
            return false;
        }

        // If two cells right...
        if (col <= this.gridCols - 3 && this.sameType(cellType, this.gridGet(row, col + 1), this.gridGet(row, col + 2))) {
            return false;
        }

        // If two cells below...
        if (row >= 2 && this.sameType(this.gridGet(row - 2, col), this.gridGet(row - 1, col), cellType)) {
            return false;
        }

        // If one cell below and one cell above...
        if (row >= 1 && col <= this.gridRows - 2 && this.sameType(this.gridGet(row - 1, col), cellType, this.gridGet(row + 1, col))) {
            return false;
        }

        // If two cells above...
        if (row <= this.gridRows - 3 && this.sameType(cellType, this.gridGet(row + 1, col), this.gridGet(row + 2, col))) {
            return false;
        }

        return true;
    }

}