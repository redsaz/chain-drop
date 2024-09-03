/// <reference path="types/phaser.d.ts"/>

// @Filename: scenes.mts
import { SceneBackground, SceneTargetTotals, SceneNextCells, SceneLevelInfo, SceneMultitouch, SceneLevelClear, SceneLevelLost, SceneLevelDoneMenu } from "scenes";
import * as consts from "consts";
import { GameState, GameThingies, GameSettings, GameListener, TargetTotals, LEVELS, SinglePlayerGame, ActionEvent } from "game";
import { BoardListener } from "gameboard";
import { GameControls } from "controls";
// For randomness, use  PCG-XSH-RR
// (XOR-shift high, Random Rotation)
// https://www.pcg-random.org/pdf/hmc-cs-2014-0905.pdf
// 32-bit output, 64-bit state
import init, { Rand } from "chaindrop";

interface CellSprite extends Phaser.GameObjects.Sprite {
    cellValue?: integer;
}

init().then(() => {
    class SceneGrid extends Phaser.Scene implements BoardListener, GameListener {
        tickDuration = 1000 / 60;
        ticksLeftover: number = 0; // sometimes a little extra or a little less delta is between updates.
        gameThingies: GameThingies | undefined;

        gameLogic: SinglePlayerGame = new SinglePlayerGame(Rand.new(), new TargetTotals(), 0, this);

        gridDisplay: (CellSprite | null)[] = Array(this.gameLogic.board.gridRows * this.gameLogic.board.gridCols);
        cellsActiveDisplay: (CellSprite | null)[] = Array();

        cellToScene(row: integer, col: integer, cellValue: integer): CellSprite | null {
            let sprite: CellSprite;
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

            sprite.cellValue = cellValue;

            return sprite;
        }

        cellActiveToScene(row: integer, col: integer, rotation: integer, index: number, cellValue: integer): CellSprite | null {
            let abs = this.gameLogic.cellActiveGetPosAbsolute(row, col, rotation, index, cellValue);
            return this.cellToScene(abs[0], abs[1], abs[2]);
        }

        colToX(col: integer): integer {
            // cols go from left (0) to right (7)
            return col * 32 + 16;
        }

        rowToY(row: integer): integer {
            // rows go from bottom (0) to top (15), which is reverse of how pixels are done.
            return 544 - (row * 32 + 16);
        }

        constructor(config?: Phaser.Types.Core.GameConfig) {
            super(config ?? { key: 'SceneGrid', active: true });

            const numCells = this.gameLogic.board.gridRows * this.gameLogic.board.gridCols;
            for (let i = 0; i < numCells; ++i) {
                this.gridDisplay[i] = null;
            }
        }

        receivedAction(actionEvent: ActionEvent): void {
            this.gameLogic.pushActionEvent(actionEvent);
        }

        setCell(row: number, col: number, cellValue: number): void {
            let index = row * this.gameLogic.board.gridCols + col;
            let sprite = this.gridDisplay[index];
            if (sprite != null) {
                sprite.destroy();
            }
            this.gridDisplay[index] = this.cellToScene(row, col, cellValue);
        }

        deleteCell(fancy: boolean, row: number, col: number): void {
            let index = this.gameLogic.board.gridIndex(row, col);
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

        moveCell(row: number, col: number, rowChange: number, colChange: number): void {
            let sourceIndex = this.gameLogic.board.gridIndex(row, col);
            let targetIndex = this.gameLogic.board.gridIndex(row + rowChange, col + colChange);
            let oldTargetCell = this.gridDisplay[targetIndex];
            if (oldTargetCell != null && oldTargetCell?.cellValue != consts.CELL_EMPTY) {
                oldTargetCell.destroy();
            }

            this.gridDisplay[targetIndex] = this.gridDisplay[sourceIndex];
            this.gridDisplay[sourceIndex] = null;
            this.gridDisplay[targetIndex]?.setPosition(this.colToX(col + colChange), this.rowToY(row + rowChange));
        }

        newNext(left: integer, right: integer): void {
            console.log(`newNext left=${left} right=${right}`);
            this.gameThingies?.boardEvents.emit('newNext', left, right);
        }

        moveActive(activeCells: integer[], row: number, col: number, rot: number): void {
            console.log(`moveActive activeCells=${activeCells} row=${row} col=${col}, rot=${rot}`);
            // Update display
            // Delete the current sprites then create new ones at correct position
            while (this.cellsActiveDisplay.length) {
                this.cellsActiveDisplay.shift()?.destroy();
            }
            activeCells.forEach((cell, index) => this.cellsActiveDisplay.push(this.cellActiveToScene(row, col, rot, index, cell)));
        }

        updatedState(state: GameState): void {
            console.log(`updatedState ${state}`);
            // Do not show active piece if not currently active.
            if (state != GameState.Active) {
                // Delete the active sprites
                while (this.cellsActiveDisplay.length) {
                    this.cellsActiveDisplay.shift()?.destroy();
                }
            }
            switch (state) {
                case GameState.DoneLost: {
                    // TODO: This should not be instant.
                    if (!this.scene.isActive("SceneLevelLost")) {
                        this.scene.run("SceneLevelLost")
                    }
                    break;
                }
                case GameState.DoneWon: {
                    // TODO: This should not be instant.
                    if (!this.scene.isActive("SceneLevelClear")) {
                        this.scene.run("SceneLevelClear")
                    }
                    if (!this.scene.isActive("SceneLevelDoneMenu")) {
                        this.scene.run("SceneLevelDoneMenu")
                    }
                    break;
                }
            }
        }

        startup(data: GameThingies): void {
            if (this.gameThingies?.controlsEvents != data.controlsEvents) {
                data.controlsEvents.on("action", this.receivedAction, this);
            }

            this.add.rectangle(128, 272, 256, 544, 0, 0.5);
            this.gameThingies = data;
            this.gameLogic = new SinglePlayerGame(
                this.gameThingies.rand, data.targetTotals, data.gameSettings.level, this);
            this.gameLogic.setBoardListener(this);
            let level = LEVELS[Math.min(this.gameLogic.level, 20)];
            let numTargets = level.numTargets;
            this.gameLogic.setupBoard(numTargets, level.highestRow);
            this.gameThingies.boardEvents.emit('newBoard', this.gameLogic.level);
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
                this.gameLogic.update();
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
    let gameThingies: GameThingies = {
        gameSettings: gameSettings,
        targetTotals: counter,
        controlsEvents: new Phaser.Events.EventEmitter(),
        boardEvents: new Phaser.Events.EventEmitter(),
        rand: Rand.new()
    };

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
    console.log(`GAME=${GAME}`);
});


