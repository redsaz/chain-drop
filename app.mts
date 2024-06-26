/// <reference path="types/phaser.d.ts"/>

// @Filename: scenes.mts
import { SceneBackground, SceneTargetTotals, SceneNextCells, SceneLevelInfo, SceneMultitouch, SceneLevelClear, SceneLevelLost, SceneLevelDoneMenu } from "scenes";
import * as consts from "consts";
import { GameThingies, GameSettings, TargetTotals, SceneStuff, LEVELS, SinglePlayerGame, ActionEvent } from "game";
import { Board, GameBoard } from "gameboard";
import { GameControls } from "controls";

class SceneGrid extends Phaser.Scene implements Board, SceneStuff {
    tickDuration = 1000 / 60;
    ticksLeftover: number = 0; // sometimes a little extra or a little less delta is between updates.
    gameThingies: GameThingies | undefined;

    gameLogic: SinglePlayerGame = new SinglePlayerGame(new TargetTotals(), 0);
    board: GameBoard = new GameBoard();

    gridDisplay: (Phaser.GameObjects.Sprite | null)[] = Array(this.board.gridRows * this.board.gridCols);
    cellsActiveDisplay: (Phaser.GameObjects.Sprite | null)[] = Array();

    cellToScene(row: integer, col: integer, cellValue: integer): Phaser.GameObjects.Sprite | null {
        let sprite: Phaser.GameObjects.Sprite;
        // cols go from left (0) to right (7)
        let xPos = this.colToX(col);
        // rows go from bottom (0) to top (15), which is reverse of how pixels are done.
        let yPos = this.rowToY(row);
        if (cellValue == 0) {
            return null;
        } else if ((cellValue & consts.CELL_TARGET) > 0) {
            sprite = this.add.sprite(xPos, yPos, 'target');
            this.tweens.add({
                targets: sprite,
                angle: 360,
                repeat: -1,
                duration: 1000
            })
        } else if ((cellValue & consts.CELL_JOINED_RIGHT) > 0) {
            sprite = this.add.sprite(xPos, yPos, 'joined');
        } else if ((cellValue & consts.CELL_JOINED_LEFT) > 0) {
            sprite = this.add.sprite(xPos, yPos, 'joined');
            sprite.flipX = true;
        } else if ((cellValue & consts.CELL_JOINED_TOP) > 0) {
            sprite = this.add.sprite(xPos, yPos, 'joined');
            sprite.setRotation(Math.PI / 2);
            sprite.flipX = true;
        } else if ((cellValue & consts.CELL_JOINED_BOTTOM) > 0) {
            sprite = this.add.sprite(xPos, yPos, 'joined');
            sprite.setRotation(Math.PI / 2);
        } else {
            sprite = this.add.sprite(xPos, yPos, 'filled')
        }
        sprite.setScale(0.125, 0.125);

        let color = 0xffffff;
        if ((consts.CELL_TYPE_MASK & cellValue) == 1) {
            color = consts.CELL_1_COLOR;
        } else if ((consts.CELL_TYPE_MASK & cellValue) == 2) {
            color = consts.CELL_2_COLOR;
        } else if ((consts.CELL_TYPE_MASK & cellValue) == 3) {
            color = consts.CELL_3_COLOR;
        }
        sprite.setTint(color);

        return sprite;
    }

    cellActiveToScene(row: integer, col: integer, rotation: integer, index: number, cellValue: integer): Phaser.GameObjects.Sprite | null {
        let abs = this.cellActiveGetPosAbsolute(row, col, rotation, index, cellValue);
        return this.cellToScene(abs[0], abs[1], abs[2]);
    }

    cellActiveGetPosAbsolute(row: integer, col: integer, rotation: integer, index: number, cellValue: integer): [integer, integer, integer] {
        // In 0th rotation, first cell is at the row and col, second cell is to the right.
        let join1 = 0;
        let join2 = 0;
        if (rotation == 0) {
            col += index;
            join1 = consts.CELL_JOINED_RIGHT;
            join2 = consts.CELL_JOINED_LEFT;
        } else if (rotation == 1) {
            // In 1st rotation, first cell is above, second cell is at row and col.
            row += 1 - index;
            join1 = consts.CELL_JOINED_BOTTOM;
            join2 = consts.CELL_JOINED_TOP;
        } else if (rotation == 2) {
            // In 2nd rotation, first cell is to the right, second cell is at row and col.
            col += 1 - index;
            join1 = consts.CELL_JOINED_LEFT;
            join2 = consts.CELL_JOINED_RIGHT;
        } else if (rotation == 3) {
            // In 3rd rotation, first cell is at row and col, second cell is above.
            row += index;
            join1 = consts.CELL_JOINED_TOP;
            join2 = consts.CELL_JOINED_BOTTOM;
        }

        // Use the correct join depending on which active cell we're looking at
        cellValue &= consts.CELL_TYPE_MASK;
        if (index == 0) {
            cellValue |= join1;
        } else {
            cellValue |= join2;
        }
        return [row, col, cellValue];
    }

    cellActiveUpdatePos(row: integer, col: integer, rotation: integer, index: number, sprite: Phaser.GameObjects.Sprite | null): void {
        if (sprite == null) {
            return;
        }

        // In 0th rotation, first cell is at the row and col, second cell is to the right.
        let join1 = 0;
        let join2 = 0;
        if (rotation == 0) {
            col += index;
        } else if (rotation == 1) {
            // In 1st rotation, first cell is above, second cell is at row and col.
            row += 1 - index;
        } else if (rotation == 2) {
            // In 2nd rotation, first cell is to the right, second cell is at row and col.
            col += 1 - index;
        } else if (rotation == 3) {
            // In 3rd rotation, first cell is at row and col, second cell is above.
            row += index;
        }
        sprite.setPosition(this.colToX(col), this.rowToY(row) + 4);
    }

    colToX(col: integer): integer {
        // cols go from left (0) to right (7)
        return col * 32 + 16;
    }

    rowToY(row: integer): integer {
        // rows go from bottom (0) to top (15), which is reverse of how pixels are done.
        return 544 - (row * 32 + 16);
    }

    numGridRows(): number {
        return this.board.numGridRows();
    }

    numGridCols(): number {
        return this.board.numGridCols();
    }

    gridGet(row: number, col: number): number {
        return this.board.gridGet(row, col);
    }

    gridSet(row: number, col: number, cellValue: integer) {
        let oldCell = this.board.gridSet(row, col, cellValue);
        let index = row * this.board.gridCols + col;
        if (oldCell != cellValue) {
            let sprite = this.gridDisplay[index];
            if (sprite != null) {
                sprite.destroy();
            }
            this.gridDisplay[index] = this.cellToScene(row, col, cellValue);
        }
    }

    gridMove(row: number, col: number, rowChange: number, colChange: number) {
        let oldTargetCell = this.board.gridMove(row, col, rowChange, colChange);
        let sourceIndex = this.board.gridIndex(row, col);
        let targetIndex = this.board.gridIndex(row + rowChange, col + colChange);
        if (oldTargetCell != consts.CELL_EMPTY) {
            let sprite = this.gridDisplay[targetIndex];
            sprite?.destroy();
        }
        this.gridDisplay[targetIndex] = this.gridDisplay[sourceIndex];
        this.gridDisplay[sourceIndex] = null;
        this.gridDisplay[targetIndex]?.setPosition(this.colToX(col + colChange), this.rowToY(row + rowChange));
    }

    // Deletes the cell at the location, and "unjoins" any cells joined to that cell.
    gridDelete(fancy: boolean, row: number, col: number): integer {
        let old = this.board.gridGet(row, col);
        // If cell is connected above, remove that cell's respective join.
        if ((old & consts.CELL_JOINED_TOP) != 0) {
            this.gridSet(row + 1, col, this.board.gridGet(row + 1, col) & ~consts.CELL_JOINED_BOTTOM);
        }
        // If cell is connected right, remove that cell's respective join.
        if ((old & consts.CELL_JOINED_RIGHT) != 0) {
            this.gridSet(row, col + 1, this.board.gridGet(row, col + 1) & ~consts.CELL_JOINED_LEFT);
        }
        // If cell is connected below, remove that cell's respective join.
        if ((old & consts.CELL_JOINED_BOTTOM) != 0) {
            this.gridSet(row - 1, col, this.board.gridGet(row - 1, col) & ~consts.CELL_JOINED_TOP);
        }
        // If cell is connected left, remove that cell's respective join.
        if ((old & consts.CELL_JOINED_LEFT) != 0) {
            this.gridSet(row, col - 1, this.board.gridGet(row, col - 1) & ~consts.CELL_JOINED_RIGHT);
        }

        // Fancy delete the given cell
        let index = this.board.gridIndex(row, col);
        let oldCell = this.board.grid[index];
        if (oldCell != consts.CELL_EMPTY) {
            this.board.grid[index] = consts.CELL_EMPTY;
            let sprite = this.gridDisplay[index];
            if (fancy) {
                this.tweens.add({
                    targets: sprite,
                    alpha: 0,
                    scaleX: 0,
                    scaleY: 0,
                    persist: false,
                    duration: 250,
                    callbackScope: sprite,
                    onComplete: () => sprite?.destroy()
                });
            } else {
                sprite?.destroy();
            }
        }

        return old;
    }

    // Returns sets of cells to clear from the board (but doesn't clear them itself).
    // Only settled cells are considered for clearing.
    getCellsToClear(): [integer, integer][][] {
        return this.board.getCellsToClear();
    }

    cellsActiveCanMove(posRow: number, posCol: number, rotation: number): boolean {
        return this.board.cellsActiveCanMove(posRow, posCol, rotation);
    }

    sameType(cell: integer, ...cells: integer[]): boolean {
        return this.board.sameType(cell, ...cells);
    }

    canPlaceTarget(row: number, col: number, cell: integer): boolean {
        return this.board.canPlaceTarget(row, col, cell);
    }

    constructor(config?: Phaser.Types.Core.GameConfig) {
        super(config ?? { key: 'SceneGrid', active: true });

        for (let i = 0; i < this.board.gridRows * this.board.gridCols; ++i) {
            this.board.grid[i] = consts.CELL_EMPTY;
            this.gridDisplay[i] = null;
        }
    }

    receivedAction(actionEvent: ActionEvent): void {
        this.gameLogic.pushActionEvent(actionEvent);
    }

    startup(data: GameThingies): void {
        if (this.gameThingies?.controlsEvents != data.controlsEvents) {
            data.controlsEvents.on("action", this.receivedAction, this);
        }

        this.gameThingies = data;
        this.gameLogic = new SinglePlayerGame(data.targetTotals, data.gameSettings.level);
        let level = LEVELS[Math.min(this.gameLogic.level, 20)];
        let numTargets = level.numTargets;
        this.board.grid.forEach((item, i, arr) => arr[i] = consts.CELL_EMPTY);
        this.add.rectangle(128, 272, 256, 544, 0, 0.5);
        // Add some targets on the board
        let maxRow = level.highestRow;
        for (let i = 0; i < numTargets; ++i) {
            let row = Math.floor(Math.random() * maxRow);
            let col = Math.floor(Math.random() * (this.board.gridCols));
            let target = consts.CELL_TYPES[Math.floor(Math.random() * consts.CELL_TYPES.length)] | consts.CELL_TARGET;
            let placed = false;
            for (let attempts = 0; attempts < maxRow * this.board.gridCols; ++attempts) {
                if (this.board.canPlaceTarget(row, col, target)) {
                    this.gridSet(row, col, target);
                    if ((target & consts.CELL_TYPE_MASK) == consts.CELL_1) {
                        ++this.gameLogic.targetTotals.cell1;
                    } else if ((target & consts.CELL_TYPE_MASK) == consts.CELL_2) {
                        ++this.gameLogic.targetTotals.cell2;
                    } else if ((target & consts.CELL_TYPE_MASK) == consts.CELL_3) {
                        ++this.gameLogic.targetTotals.cell3;
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
        this.gameThingies.boardEvents.emit('newBoard', this.gameLogic.level);
        this.gameThingies.boardEvents.emit('newNext', this.gameLogic.cellsNext[0], this.gameLogic.cellsNext[1]);
    }

    preload(): void {
        this.load.image('target', 'assets/pics/target.png');
        this.load.image('joined', 'assets/pics/joined.png');
        this.load.image('filled', 'assets/pics/filled.png');
        this.cameras.main.setViewport(272, 38, 256, 544);
    }

    create(data: GameThingies): void {
        this.startup(data);
    }

    update(time: number, delta: number): void {
        let ticksAndFraction = (delta / this.tickDuration) + this.ticksLeftover;
        let ticksToUpdate: number;
        // If not enough time has passed for a full tick, but for over half a tick, then
        // count it as a tick, but have a negative leftover value to indicate it's ahead.
        if (ticksAndFraction < 1.0 && ticksAndFraction > 0.5) {
            ticksToUpdate = 1;
        } else {
            ticksToUpdate = Math.floor(ticksAndFraction);
        }
        this.ticksLeftover = ticksAndFraction - ticksToUpdate;

        for (let i = 0; i < ticksToUpdate; ++i) {
            this.gameLogic.update(i == 0, this, this.gameThingies, this, this.cellsActiveDisplay, this.scene);
        }
    }
}

let config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: 'content',
    backgroundColor: '#253912',
    scale: {
        mode: Phaser.Scale.FIT,
        parent: 'phaser-example',
        width: 800,
        height: 600,
        zoom: 1,
        autoCenter: Phaser.Scale.Center.CENTER_BOTH
    }
};

const GAME = new Phaser.Game(config);

let counter = new TargetTotals();
let gameSettings: GameSettings = { level: 0, speed: 40 };
let gameThingies: GameThingies = { gameSettings: gameSettings, targetTotals: counter, controlsEvents: new Phaser.Events.EventEmitter(), boardEvents: new Phaser.Events.EventEmitter() };

GAME.scene.add('SceneBackground', SceneBackground, true);
GAME.scene.add('SceneTargetTotals', SceneTargetTotals, true, { targetTotals: counter });
GAME.scene.add('SceneNextCells', SceneNextCells, true, gameThingies);
GAME.scene.add('SceneLevelInfo', SceneLevelInfo, true, gameThingies);
GAME.scene.add('Controls', GameControls, true, gameThingies.controlsEvents);
GAME.scene.add('SceneGrid', SceneGrid, true, gameThingies);
GAME.scene.add('SceneMultitouch', SceneMultitouch, true, gameThingies);
GAME.scene.add('SceneLevelClear', SceneLevelClear, false, gameThingies);
GAME.scene.add('SceneLevelLost', SceneLevelLost, false);
GAME.scene.add('SceneLevelDoneMenu', SceneLevelDoneMenu, false, gameThingies);
