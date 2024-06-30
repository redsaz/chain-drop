/// <reference path="types/phaser.d.ts"/>
import * as consts from "consts";
import { GameBoard, BoardListener } from "gameboard";

export class TargetTotals {
    cell1 = 0;
    cell2 = 0;
    cell3 = 0;
}

export interface GameSettings {
    level: integer;
    speed: number;
}

export interface GameThingies {
    gameSettings: GameSettings;
    targetTotals: TargetTotals;
    controlsEvents: Phaser.Events.EventEmitter;
    boardEvents: Phaser.Events.EventEmitter;
}

export interface Level {
    numTargets: integer;
    highestRow: integer;
}

export interface SceneStuff {
    cellToScene(row: integer, col: integer, cellValue: integer): Phaser.GameObjects.Sprite | null, cellActiveToScene(row: integer, col: integer, rotation: integer, index: number, cellValue: integer): Phaser.GameObjects.Sprite | null,
    cellActiveGetPosAbsolute(row: integer, col: integer, rotation: integer, index: number, cellValue: integer): [integer, integer, integer], cellActiveUpdatePos(row: integer, col: integer, rotation: integer, index: number, sprite: Phaser.GameObjects.Sprite | null): void,
    colToX(col: integer): integer,
    rowToY(row: integer): integer,
}

export const LEVELS: Level[] = [
    { numTargets: 4, highestRow: 10 },
    { numTargets: 8, highestRow: 10 },
    { numTargets: 12, highestRow: 10 },
    { numTargets: 16, highestRow: 10 },
    { numTargets: 20, highestRow: 10 },
    { numTargets: 24, highestRow: 10 },
    { numTargets: 28, highestRow: 10 },
    { numTargets: 32, highestRow: 10 },
    { numTargets: 36, highestRow: 10 },
    { numTargets: 40, highestRow: 10 },
    { numTargets: 44, highestRow: 10 },
    { numTargets: 48, highestRow: 10 },
    { numTargets: 52, highestRow: 10 },
    { numTargets: 56, highestRow: 10 },
    { numTargets: 60, highestRow: 10 },
    { numTargets: 64, highestRow: 11 },
    { numTargets: 68, highestRow: 11 },
    { numTargets: 72, highestRow: 12 },
    { numTargets: 76, highestRow: 12 },
    { numTargets: 80, highestRow: 13 },
    { numTargets: 84, highestRow: 13 },
];

enum GameState {
    Pregame = 1, // Game hasn't started yet (counting down, whatever)
    Releasing, // The active cells are preparing into the grid
    Active, // The player can control the active cells
    Settle, // The active cells have been set, and possibly cleared and gravity needs to affect the board.
    DoneLost, // The game is finished, the player lost.
    DoneWon, // The game is finished, the player won.
}

export type ActionEvent = "noop" | "left" | "right" | "rotateCcw" | "rotateCw" | "shove";

export class SinglePlayerGame {
    #tick: number = 0; // The current logical "frame" the game is at (not graphical frame)
    // TODO: Make gameState be private #gameState and handle state logic within.
    // TODO: Make the rest private as well.
    gameState: GameState = GameState.Pregame;
    board: GameBoard;
    level = 0;
    startRow = 15;
    startCol = 3;
    activePosRow = 0;
    activePosCol = 0;
    activeRotation = 0;
    #cellsActive: integer[] = Array();
    cellsNext: integer[] = Array();
    #dropCounter = 0;
    #dropRate = 40;
    targetTotals: TargetTotals;
    #releaseCounter = 0;
    #settleCounter = 0;
    #actionEvents: ActionEvent[] = Array();

    constructor(targetTotals: TargetTotals, level: number) {
        this.gameState = GameState.Pregame;
        this.board = new GameBoard(17, 8);
        this.targetTotals = targetTotals;
        this.level = level;
        this.cellsNext.length = 0;
        this.cellsNext.push(consts.CELL_TYPES[Math.floor(Math.random() * consts.CELL_TYPES.length)]);
        this.cellsNext.push(consts.CELL_TYPES[Math.floor(Math.random() * consts.CELL_TYPES.length)]);
        // Init the active cells
        this.activePosRow = this.startRow;
        this.activePosCol = this.startCol;
        this.activeRotation = 0;
    }

    setBoardListener(listener : BoardListener) {
        this.board.setListener(listener);
    }

    setupBoard(numTargets: number, maxRow: number) {
        // Add some targets on the board
        for (let i = 0; i < numTargets; ++i) {
            let row = Math.floor(Math.random() * maxRow);
            let col = Math.floor(Math.random() * (this.board.gridCols));
            let target = consts.CELL_TYPES[Math.floor(Math.random() * consts.CELL_TYPES.length)] | consts.CELL_TARGET;
            for (let attempts = 0; attempts < maxRow * this.board.gridCols; ++attempts) {
                if (this.board.canPlaceTarget(row, col, target)) {
                    this.board.gridSet(row, col, target);
                    if ((target & consts.CELL_TYPE_MASK) == consts.CELL_1) {
                        ++this.targetTotals.cell1;
                    } else if ((target & consts.CELL_TYPE_MASK) == consts.CELL_2) {
                        ++this.targetTotals.cell2;
                    } else if ((target & consts.CELL_TYPE_MASK) == consts.CELL_3) {
                        ++this.targetTotals.cell3;
                    }
                    break;
                }
                ++col;
                if (col >= this.board.gridCols) {
                    col = 0;
                    --row;
                    if (row < 0) {
                        row = maxRow - 1;
                    }
                }
            }
        }
    }

    #activeSet(stuff: SceneStuff, cellsActiveDisplay: (Phaser.GameObjects.Sprite | null)[]): void {
        this.#cellsActive.forEach((cell, index) => {
            let abs = stuff.cellActiveGetPosAbsolute(this.activePosRow, this.activePosCol, this.activeRotation, index, cell);
            this.board.gridSet(abs[0], abs[1], abs[2]);
        });

        // Clear the grid's topmost row of cells, as cells shouldn't be set there
        for (let col = 0; col < this.board.numGridCols(); ++col) {
            this.board.gridDelete(false, this.board.numGridRows() - 1, col);
            this.board.gridDelete(false, this.board.numGridRows() - 1, col);
        }

        // Delete the active sprites
        while (cellsActiveDisplay.length) {
            cellsActiveDisplay.shift()?.destroy();
        }
    }

    // Pushes an action event to the current tick's queue. Multiple actions can
    // be performed per tick, but only a maximum of one per action (so, you can
    // shove down, and move left, but you can shove down 5 times and move left
    // 3 times in a single tick.)
    // If an action can't be performed (either because the game state doesn't
    // allow it, like currently waiting for the cells to settle, or because the
    // move is blocked, like can't move left because piece is at edge already)
    // then the action is dropped. No actions carry over to the next tick.
    pushActionEvent(actionEvent: ActionEvent): void {
        if (!this.#actionEvents.includes(actionEvent)) {
            this.#actionEvents.push(actionEvent);
        }
    }

    #rotate(amount: integer, stuff: SceneStuff, cellsActiveDisplay: (Phaser.GameObjects.Sprite | null)[]): void {
        // Can only rotate when active cell is in play
        if (this.gameState != GameState.Active) {
            return;
        }

        // If the proposed rotation will not clobber a filled cell, then allow it, but if rotating
        // from a vertical position to a horizontal one and it would clobber a filled cell,
        // try kicking left one col. If no clobbers, then go with that.
        let rotation = 3 - ((3 - ((this.activeRotation + amount) % 4)) % 4)
        let posCol = this.activePosCol;
        if (!this.board.cellsActiveCanMove(this.activePosRow, posCol, rotation) && (rotation % 2) == 0) {
            --posCol;
        }
        if (this.board.cellsActiveCanMove(this.activePosRow, posCol, rotation)) {
            this.activeRotation = rotation;
            this.activePosCol = posCol;

            // Update display
            // Delete the current sprites then create new ones at correct position
            while (cellsActiveDisplay.length) {
                cellsActiveDisplay.shift()?.destroy();
            }
            this.#cellsActive.forEach((cell, index) => cellsActiveDisplay.push(stuff.cellActiveToScene(this.activePosRow, this.activePosCol, this.activeRotation, index, cell)));
        }
    }

    // Drop (by one) all cells that are not settled.
    #dropDanglingCells(): boolean {
        let dropped = false; // if at least one cell dropped by gravity, the function will need to run again.
        let dropline = new Array<boolean>(this.board.numGridCols()); // Calculate drops for an entire line before dropping.
        // Work from the bottom up (well, not the bottom-most row though)
        for (let row = 1; row < this.board.numGridRows(); ++row) {
            for (let col = 0; col < this.board.numGridCols(); ++col) {
                let nodrop = false; // If nodrop is true, do not drop the cell.
                let cell = this.board.gridGet(row, col);

                // If the cell is empty, do not drop.
                nodrop ||= cell == consts.CELL_EMPTY;
                // If the cell is a target, do not drop
                nodrop ||= (cell & consts.CELL_TARGET) > 0;
                // If the cell below this cell is occupied, do not drop this cell.
                nodrop ||= (this.board.gridGet(row - 1, col) != consts.CELL_EMPTY);
                // If the cell is joined right, and the cell below that is occupied, don't drop.
                nodrop ||= ((cell & consts.CELL_JOINED_RIGHT) != 0 && this.board.gridGet(row - 1, col + 1) != consts.CELL_EMPTY);
                // If the cell is joined left, and the cell below that is occupied, don't drop.
                nodrop ||= ((cell & consts.CELL_JOINED_LEFT) != 0 && this.board.gridGet(row - 1, col - 1) != consts.CELL_EMPTY);

                dropline[col] = !nodrop;
            }
            // Now that each column has been calculated to drop or not, drop the correct parts of the line
            for (let col = 0; col < this.board.numGridCols(); ++col) {
                let shouldDrop = dropline[col];
                dropped ||= shouldDrop;
                if (shouldDrop) {
                    this.board.gridMove(row, col, -1, 0);
                }
            }
        }

        return dropped;
    }

    #activeStateUpdate(stuff: SceneStuff, gameThingies: GameThingies | undefined, cellsActiveDisplay: (Phaser.GameObjects.Sprite | null)[], scene: Phaser.Scenes.ScenePlugin): void {

        ++this.#dropCounter;

        let changed = false;
        let shouldSettle = false;

        this.#actionEvents.forEach((actionEvent) => {
            switch (actionEvent) {
                case "noop":
                    // Do nothing.
                    break;
                case "left":
                    // If the active cells can go left, then go.
                    if (this.board.cellsActiveCanMove(this.activePosRow, this.activePosCol - 1, this.activeRotation)) {
                        --this.activePosCol;
                        changed = true;
                    }
                    break;
                case "right":
                    if (this.board.cellsActiveCanMove(this.activePosRow, this.activePosCol + 1, this.activeRotation)) {
                        ++this.activePosCol;
                        changed = true;
                    }
                    break;
                case "rotateCcw":
                    this.#rotate(-1, stuff, cellsActiveDisplay);
                    break;
                case "rotateCw":
                    this.#rotate(1, stuff, cellsActiveDisplay);
                    break;
                case "shove":
                    if (this.board.cellsActiveCanMove(this.activePosRow - 1, this.activePosCol, this.activeRotation)) {
                        --this.activePosRow;
                        changed = true;
                        this.#dropCounter = 0;
                    } else {
                        shouldSettle = true;
                    }
                    break;
                default:
                    console.log(`Unknown action=${actionEvent}`);
            }
        });
        // All requested actions completed, so clean the queue for the next tick.
        this.#actionEvents.length = 0;

        if (this.#dropCounter >= this.#dropRate) {
            this.#dropCounter = 0;
            if (this.board.cellsActiveCanMove(this.activePosRow - 1, this.activePosCol, this.activeRotation)) {
                --this.activePosRow;
            } else {
                shouldSettle = true;
            }
            changed = true;
        }

        if (shouldSettle) {
            this.#activeSet(stuff, cellsActiveDisplay);
            this.gameState = GameState.Settle;
            changed = true;
        }

        // Update the positions of the active cells if anything changed
        if (changed) {
            cellsActiveDisplay.forEach((sprite: Phaser.GameObjects.Sprite | null, index) =>
                stuff.cellActiveUpdatePos(this.activePosRow, this.activePosCol, this.activeRotation, index, sprite));
        }
    }

    update(stuff: SceneStuff, gameThingies: GameThingies | undefined, cellsActiveDisplay: (Phaser.GameObjects.Sprite | null)[], scene: Phaser.Scenes.ScenePlugin) {
        ++this.#tick;
        switch (this.gameState) {
            case GameState.Pregame: {
                // This is normally used to set up the board, but it kinda already is,
                // so we do nothing but start the game... for now.
                this.gameState = GameState.Releasing;
                break;
            }
            case GameState.Releasing: {
                if (this.#releaseCounter == 0) {
                    // TODO Find better place for getting next cell colors.
                    this.#cellsActive.length = 0;
                    this.#cellsActive.push(this.cellsNext[0], this.cellsNext[1]);
                    this.cellsNext.length = 0;
                    this.cellsNext.push(consts.CELL_TYPES[Math.floor(Math.random() * consts.CELL_TYPES.length)]);
                    this.cellsNext.push(consts.CELL_TYPES[Math.floor(Math.random() * consts.CELL_TYPES.length)]);
                    gameThingies?.boardEvents.emit('newNext', this.cellsNext[0], this.cellsNext[1]);
                }
                if (this.#releaseCounter < 45) {
                    ++this.#releaseCounter;
                } else {
                    this.#releaseCounter = 0;

                    // If any of the cells where the active cells are placed is filled, then game over.
                    // (still place the active cells anyway, to show why)
                    let start1 = this.board.gridGet(this.startRow, this.startCol);
                    let start2 = this.board.gridGet(this.startRow, this.startCol + 1);

                    this.gameState = GameState.Active;

                    // position and display the active cells
                    this.activePosRow = this.startRow;
                    this.activePosCol = this.startCol;
                    this.activeRotation = 0;
                    this.#cellsActive.forEach((cell, index) => cellsActiveDisplay.push(stuff.cellActiveToScene(this.activePosRow, this.activePosCol, this.activeRotation, index, cell)));

                    if (start1 != consts.CELL_EMPTY || start2 != consts.CELL_EMPTY) {
                        this.gameState = GameState.DoneLost;
                    }
                }
                break;
            }
            case GameState.Active: {
                // Some systems may have so much lag that it can't keep up with a full 60 fps,
                // and we must process 2 or more ticks in an update (that is, if we expect 60
                // fps but are only getting 15, then we're doing 4 loop iterations every
                // update to keep the speed correct.)
                this.#activeStateUpdate(stuff, gameThingies, cellsActiveDisplay, scene);
                break;
            }
            case GameState.Settle: {
                ++this.#settleCounter;
                if (this.#settleCounter % 15 == 0) {
                    if (!this.#dropDanglingCells()) {
                        // TODO: This should not be instant.
                        let seriesToClear = this.board.getCellsToClear();
                        seriesToClear.forEach(series => series.forEach(cell => {
                            let deleted = this.board.gridDelete(true, ...cell);
                            // Decrement the counter corresponding to the target cleared.
                            if ((deleted & consts.CELL_TARGET) != 0) {
                                let deletedType = deleted & consts.CELL_TYPE_MASK;
                                if (deletedType == consts.CELL_1) {
                                    --this.targetTotals.cell1;
                                } else if (deletedType == consts.CELL_2) {
                                    --this.targetTotals.cell2;
                                } else if (deletedType == consts.CELL_3) {
                                    --this.targetTotals.cell3;
                                }
                            }
                        }));

                        // If all the targets are gone, then the level is cleared.
                        if (this.targetTotals.cell1 + this.targetTotals.cell2 + this.targetTotals.cell3 < 1) {
                            this.gameState = GameState.DoneWon;
                        }

                        // If nothing was cleared, then release the next active piece.
                        if (seriesToClear.length == 0) {
                            this.#settleCounter = 0;
                            this.gameState = GameState.Releasing;
                        }
                    }
                }
                break;
            }
            case GameState.DoneLost: {
                // TODO: This should not be instant.
                if (!scene.isActive("SceneLevelLost")) {
                    scene.run("SceneLevelLost")
                }
                break;
            }
            case GameState.DoneWon: {
                // TODO: This should not be instant.
                if (!scene.isActive("SceneLevelClear")) {
                    scene.run("SceneLevelClear")
                }
                if (!scene.isActive("SceneLevelDoneMenu")) {
                    scene.run("SceneLevelDoneMenu")
                }
                break;
            }
        }
        // Some game states must ignore player actions, so discard any queued actions.
        this.#actionEvents.length = 0;
    }
}
