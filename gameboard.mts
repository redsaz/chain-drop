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

    colToX(col: integer): integer {
        // cols go from left (0) to right (7)
        return col * 32 + 16;
    }

    rowToY(row: integer): integer {
        // rows go from bottom (0) to top (15), which is reverse of how pixels are done.
        return 544 - (row * 32 + 16);
    }

}