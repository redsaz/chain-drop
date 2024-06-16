/// <reference path="types/phaser.d.ts"/>

export class TargetTotals {
    cell1 = 0;
    cell2 = 0;
    cell3 = 0;
}

export interface GameSettings {
    level: integer;
    speed: number;
}

export class ControlsState {
    leftPressed = false;
    leftPressedTicks = 0;
    rightPressed = false;
    rightPressedTicks = 0;
    shovePressed = false;
    shovePressedTicks = 0;
    // Rotates are non-repeating, so this only applies to a single tick
    rotateCw = false;
    rotateCcw = false;
}

export interface GameThingies {
    gameSettings: GameSettings;
    targetTotals: TargetTotals;
    controlsState: ControlsState;
    controlsEvents: Phaser.Events.EventEmitter;
    boardEvents: Phaser.Events.EventEmitter;
}

export interface Level {
    numTargets: integer;
    highestRow: integer;
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

export enum GameState {
    Pregame = 1, // Game hasn't started yet (counting down, whatever)
    Releasing, // The active cells are preparing into the grid
    Active, // The player can control the active cells
    Settle, // The active cells have been set, and possibly cleared and gravity needs to affect the board.
    DoneLost, // The game is finished, the player lost.
    DoneWon, // The game is finished, the player won.
}

export class SinglePlayerGame {
    tick: number = 0; // The current logical "frame" the game is at (not graphical frame)
    // TODO: Make gameState be private #gameState and handle state logic within.
    gameState: GameState = GameState.Pregame;
    level = 0;
    startRow = 15;
    startCol = 3;
    activePosRow = 0;
    activePosCol = 0;
    activeRotation = 0;
    cellsActive: integer[] = Array();
    cellsNext: integer[] = Array();
    dropCounter = 0;
    dropRate = 40;
    targetTotals = new TargetTotals(); // a new instance should get passed in with create();
    releaseCounter = 0;
    settleCounter = 0;

    update() {
        ++this.tick;
    }
}
