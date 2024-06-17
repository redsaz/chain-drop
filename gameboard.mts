import * as consts from "consts";

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
export class GameBoard {
    gridRows = 17;
    gridCols = 8;
    grid: integer[] = Array(this.gridRows * this.gridCols);

    gridIndex(row: number, col: number): number {
        return row * this.gridCols + col;
    }

    gridGet(row: number, col: number): integer {
        return this.grid[this.gridIndex(row, col)];
    }

    gridSet(row: number, col: number, cellValue: integer): integer {
        let index = this.gridIndex(row, col);
        let oldCell = this.grid[index];
        if (oldCell != cellValue) {
            this.grid[index] = cellValue;
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

        return oldTargetCell;
    }

}