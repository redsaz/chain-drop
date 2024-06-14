export enum GameState {
    Pregame = 1, // Game hasn't started yet (counting down, whatever)
    Releasing, // The active cells are preparing into the grid
    Active, // The player can control the active cells
    Settle, // The active cells have been set, and possibly cleared and gravity needs to affect the board.
    DoneLost, // The game is finished, the player lost.
    DoneWon, // The game is finished, the player won.
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
export class GameBoard {
    tick: number = 0; // The current logical "frame" the game is at (not graphical frame)
    // TODO: Make gameState be private #gameState and handle state logic within.
    gameState: GameState = GameState.Pregame;

    update() {
        ++this.tick;
    }
}