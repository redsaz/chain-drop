/// <reference path="types/phaser.d.ts"t/>

class TargetTotals {
    cell1 = 0;
    cell2 = 0;
    cell3 = 0;
}

interface GameSettings {
    level: integer;
    speed: number;
}

interface GameThingies {
    gameSettings: GameSettings;
    targetTotals: TargetTotals;
    controlsState: ControlsState;
    controlsEvents: Phaser.Events.EventEmitter;
    boardEvents: Phaser.Events.EventEmitter;
}

interface Level {
    numTargets: integer;
    highestRow: integer;
}

const LEVELS: Level[] = [
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

class SceneBackground extends Phaser.Scene {

    constructor(config: Phaser.Types.Scenes.SettingsConfig) {
        super(config);
    }

    preload(): void {
        this.load.image('background', 'assets/pics/background.jpg');
    }

    create(): void {
        this.add.image(400, 300, 'background');
    }

    update(time: number, delta: number): void {
    }
}

class SceneMultitouch extends Phaser.Scene {

    controlsEvents = new Phaser.Events.EventEmitter();

    press = Symbol("press");
    release = Symbol("release");

    btns: Phaser.GameObjects.Sprite[] = [];

    constructor(config: Phaser.Types.Scenes.SettingsConfig) {
        super(config);
    }

    preload(): void {
        this.load.image('target', 'assets/pics/target.png');
    }

    create(data: GameThingies): void {
        this.controlsEvents = data.controlsEvents;
        this.input.addPointer(3);

        let alpha = 0.25;

        let left = this.add.sprite(100, 300, 'target').setScale(0.75, 0.75).setTint(CELL_1_COLOR).setAlpha(alpha);
        this.btns.push(left);
        let right = this.add.sprite(300, 300, 'target').setScale(0.75, 0.75).setTint(CELL_2_COLOR).setAlpha(alpha);
        this.btns.push(right);
        let shove = this.add.sprite(200, 500, 'target').setScale(0.75, 0.75).setTint(0x00ffff).setAlpha(alpha);
        this.btns.push(shove);
        let rotateCcw = this.add.sprite(500, 500, 'target').setScale(0.75, 0.75).setTint(CELL_3_COLOR).setAlpha(alpha);
        this.btns.push(rotateCcw);
        let rotateCw = this.add.sprite(700, 500, 'target').setScale(0.75, 0.75).setTint(0xffff00).setAlpha(alpha);
        this.btns.push(rotateCw);

        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => this.pointer(pointer));
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => this.pointer(pointer));
        this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => this.pointer(pointer));

        left.on(this.press, (pointer: Phaser.Input.Pointer) => {
            left.setTint(0xffffff);
            this.controlsEvents.emit('_internal_leftpressed');
        });
        left.on(this.release, (pointer: Phaser.Input.Pointer) => {
            left.setTint(CELL_1_COLOR);
            this.controlsEvents.emit('_internal_leftreleased');
        });

        right.on(this.press, (pointer: Phaser.Input.Pointer) => {
            right.setTint(0xffffff);
            this.controlsEvents.emit('_internal_rightpressed');
        });
        right.on(this.release, (pointer: Phaser.Input.Pointer) => {
            right.setTint(CELL_2_COLOR);
            this.controlsEvents.emit('_internal_rightreleased');
        });

        shove.on(this.press, (pointer: Phaser.Input.Pointer) => {
            shove.setTint(0xffffff);
            this.controlsEvents.emit('_internal_shovepressed');
        });
        shove.on(this.release, (pointer: Phaser.Input.Pointer) => {
            shove.setTint(0x00ffff);
            this.controlsEvents.emit('_internal_shovereleased');
        });

        rotateCcw.on(this.press, (pointer: Phaser.Input.Pointer) => {
            rotateCcw.setTint(0xffffff);
            this.controlsEvents.emit('_internal_rotateccw');
        });
        rotateCcw.on(this.release, (pointer: Phaser.Input.Pointer) => {
            rotateCcw.setTint(CELL_3_COLOR);
        });

        rotateCw.on(this.press, (pointer: Phaser.Input.Pointer) => {
            rotateCw.setTint(0xffffff);
            this.controlsEvents.emit('_internal_rotatecw');
        });
        rotateCw.on(this.release, (pointer: Phaser.Input.Pointer) => {
            rotateCw.setTint(0xffff00);
        });
    }

    update(time: number, delta: number): void {
    }

    pointer(pointer: Phaser.Input.Pointer): void {
        this.btns.forEach(btn => {
            let bounds: Phaser.Geom.Rectangle = btn.getBounds();

            if (pointer.primaryDown && bounds.contains(pointer.x, pointer.y)) {
                if (!btn.getData(pointer.identifier.toString())) {
                    btn.setData(pointer.identifier.toString(), true);
                    btn.emit(this.press, pointer);
                }
            } else {
                if (btn.getData(pointer.identifier.toString())) {
                    btn.setData(pointer.identifier.toString(), false);
                    btn.emit(this.release, pointer);
                }
            }
        });
    }

}

class SceneLevelClear extends Phaser.Scene {

    gameThingies: GameThingies | undefined;

    constructor(config: Phaser.Types.Scenes.SettingsConfig) {
        super(config);
    }

    preload(): void {
    }

    create(data: GameThingies): void {
        var text = this.add.text(400, 300, 'CLEAR!', { fontSize: '66px', fontFamily: 'Sans-Serif', fontStyle: 'bold', color: '#fff', stroke: '#000', strokeThickness: 10, align: 'center' });
        text.setX(this.cameras.default.centerX - (text.width / 2));
        text.setY(this.cameras.default.centerY - (text.height / 2));

        this.input.keyboard?.addKey(13, false, false).on('down', this.goNext, this);
        this.input.keyboard?.addKey(32, false, false).on('down', this.goNext, this);

        gameThingies = data;
    }

    update(time: number, delta: number): void {
    }

    // Move on from this screen
    goNext(): void {
        if (gameThingies != undefined) {
            gameThingies.gameSettings.level++;
        }
        this.scene.get('SceneGrid').scene.restart();
        this.scene.stop(this.scene.key);
    }
}

class SceneLevelLost extends Phaser.Scene {

    constructor(config: Phaser.Types.Scenes.SettingsConfig) {
        super(config);
    }

    preload(): void {
    }

    create(): void {
        var text = this.add.text(400, 300, ['GAME', 'OVER'], { fontSize: '66px', fontFamily: 'Sans-Serif', fontStyle: 'bold', color: '#fff', stroke: '#000', strokeThickness: 10, align: 'center' });
        text.setX(this.cameras.default.centerX - (text.width / 2));
        text.setY(this.cameras.default.centerY - (text.height / 2));

    }

    update(time: number, delta: number): void {
    }
}

const CELL_TYPE_MASK = 0b0000_0111;
const CELL_EMPTY = 0b0000_0000;
const CELL_JOINED_TOP = 0b0001_0000;
const CELL_JOINED_RIGHT = 0b0010_0000;
const CELL_JOINED_BOTTOM = 0b0100_0000;
const CELL_JOINED_LEFT = 0b1000_0000;
const CELL_TARGET = 0b0000_1000;
const CELL_1 = 0b0000_0001;
const CELL_2 = 0b0000_0010;
const CELL_3 = 0b0000_0011;
const CELL_1_COLOR = 0xff0000;
const CELL_2_COLOR = 0x00ff00;
const CELL_3_COLOR = 0x4466ff;

const CELL_TYPES = [CELL_1, CELL_2, CELL_3];

function getCellColor(cellValue: integer): integer {
    let color = 0xffffff;
    if ((CELL_TYPE_MASK & cellValue) == 1) {
        color = CELL_1_COLOR;
    } else if ((CELL_TYPE_MASK & cellValue) == 2) {
        color = CELL_2_COLOR;
    } else if ((CELL_TYPE_MASK & cellValue) == 3) {
        color = CELL_3_COLOR;
    }
    return color;
}

const SHIFT_TICKS_REPEAT_DELAY = 15;
const SHIFT_TICKS_REPEAT_RATE = 6;
const SHOVE_TICKS_REPEAT_DELAY = 2;

const GAME_STATE_PREGAME = 1; // Game hasn't started yet (counting down, whatever)
const GAME_STATE_RELEASING = 2; // The active cells are preparing into the grid
const GAME_STATE_ACTIVE = 3; // The player can control the active cells
const GAME_STATE_SETTLE = 4; // The active cells have been set, and possibly cleared and gravity needs to affect the board.
const GAME_STATE_DONE_LOST = 5; // The game is finished, the player lost.
const GAME_STATE_DONE_WON = 6; // The game is finished, the player won.

class ControlsState {
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

/**
 * Translates mouse/touches/keypress events into game actions. 
 * This exists for several reasons:
 * 1. The core game logic itself doesn't have to deal with multiple input sources and conflicts
 *    that can result. For example, it is possible for the player to press the left key while
 *    pressing the onscreen right button at the same time.
 * 2. So that multiple events do not get sent within the same "tick" of the game. Like, say,
 *    spamming the "leftpressed" and "leftreleased" events multiple times in a single tick in
 *    order to get the active block shoved all the way to the left.
 * 3. Similar to the first two reasons, this can prevent multiple events from different inputs
 *    from "stomping" on each other. For example, if the player holds down the left key, then
 *    presses the left onscreen button and releases it, and then releases the left key,
 *    there won't be two "left action pressed" and two "left action released" events sent to the
 *    core game logic. (Would the game consider the left button release after the first "released
 *    event", or some time later after the second "released event")?
 */
class GameControls extends Phaser.Scene {

    controlsEvents = new Phaser.Events.EventEmitter(); // To be overwritten by create.
    controlsState = new ControlsState(); // To be overwritten by create.
    rotateCwClearNext = false;
    rotateCcwClearNext = false;

    constructor(config: Phaser.Types.Scenes.SettingsConfig) {
        super(config);
    }

    preload(): void {
    }

    create(data: GameThingies): void {
        this.controlsEvents = data.controlsEvents;
        this.controlsState = data.controlsState;
        let cevents = this.controlsEvents;
        if (this.input.keyboard !== null) {
            let cursors = this.input.keyboard.createCursorKeys();
            cursors.space.on('down', () => cevents.emit('_internal_rotateccw'), this);
            cursors.up.on('down', () => cevents.emit('_internal_rotatecw'), this);
            cursors.left.on('down', () => cevents.emit('_internal_leftpressed'), this);
            cursors.left.on('up', () => cevents.emit('_internal_leftreleased'), this);
            cursors.right.on('down', () => cevents.emit('_internal_rightpressed'), this);
            cursors.right.on('up', () => cevents.emit('_internal_rightreleased'), this);
            cursors.down.on('down', () => cevents.emit('_internal_shovepressed'), this);
            cursors.down.on('up', () => cevents.emit('_internal_shovereleased'), this);
        }

        cevents.on('_internal_leftpressed', this.receivedLeftPressed, this);
        cevents.on('_internal_leftreleased', this.receivedLeftReleased, this);
        cevents.on('_internal_rightpressed', this.receivedRightPressed, this);
        cevents.on('_internal_rightreleased', this.receivedRightReleased, this);
        cevents.on('_internal_shovepressed', this.receivedShovePressed, this);
        cevents.on('_internal_shovereleased', this.receivedShoveReleased, this);
        cevents.on('_internal_rotateccw', this.receivedRotateCcw, this);
        cevents.on('_internal_rotatecw', this.receivedRotateCw, this);
    }

    receivedLeftPressed(): void {
        // NOTE: THIS WON'T DO THE ADVERTIZED LOGIC (but it's a good mvp)
        this.controlsState.leftPressed = true;
    }

    receivedLeftReleased(): void {
        // NOTE: THIS WON'T DO THE ADVERTIZED LOGIC (but it's a good mvp)
        this.controlsState.leftPressed = false;
    }

    receivedRightPressed(): void {
        // NOTE: THIS WON'T DO THE ADVERTIZED LOGIC (but it's a good mvp)
        this.controlsState.rightPressed = true;
    }

    receivedRightReleased(): void {
        // NOTE: THIS WON'T DO THE ADVERTIZED LOGIC (but it's a good mvp)
        this.controlsState.rightPressed = false;
    }

    receivedShovePressed(): void {
        // NOTE: THIS WON'T DO THE ADVERTIZED LOGIC (but it's a good mvp)
        this.controlsState.shovePressed = true;
    }

    receivedShoveReleased(): void {
        // NOTE: THIS WON'T DO THE ADVERTIZED LOGIC (but it's a good mvp)
        this.controlsState.shovePressed = false;
    }

    receivedRotateCcw(): void {
        // NOTE: THIS WON'T DO THE ADVERTIZED LOGIC (but it's a good mvp)
        this.controlsState.rotateCcw = true;
        this.rotateCcwClearNext = true;
        this.controlsEvents.emit('rotateccw');
    }

    receivedRotateCw(): void {
        this.controlsState.rotateCw = true;
        this.rotateCwClearNext = true;
        this.controlsEvents.emit('rotatecw');
    }

    update(time: number, delta: number): void {
        if (this.controlsState.leftPressed) {
            if (repeaty(this.controlsState.leftPressedTicks, SHIFT_TICKS_REPEAT_DELAY, SHIFT_TICKS_REPEAT_RATE)) {
                // then fire event? Dunno.
            }
            ++this.controlsState.leftPressedTicks;
        } else {
            this.controlsState.leftPressedTicks = 0;
        }
        if (this.controlsState.rightPressed) {
            if (repeaty(this.controlsState.rightPressedTicks, SHIFT_TICKS_REPEAT_DELAY, SHIFT_TICKS_REPEAT_RATE)) {
                // then fire event? Dunno.
            }
            ++this.controlsState.rightPressedTicks;
        } else {
            this.controlsState.rightPressedTicks = 0;
        }
        if (this.controlsState.shovePressed) {
            if (repeaty(this.controlsState.shovePressedTicks, SHIFT_TICKS_REPEAT_DELAY, SHIFT_TICKS_REPEAT_RATE)) {
                // then fire event? Dunno.
            }
            ++this.controlsState.shovePressedTicks;
        } else {
            this.controlsState.shovePressedTicks = 0;
        }
        if (this.controlsState.rotateCcw) {
            // then fire event? Dunno.
            if (this.rotateCcwClearNext) {
                this.rotateCcwClearNext = false;
            } else {
                this.controlsState.rotateCcw = false; // Effect has no repeats, so it's done
            }
        }
        if (this.controlsState.rotateCcw) {
            // then fire event? Dunno.
            if (this.rotateCwClearNext) {
                this.rotateCwClearNext = false;
            } else {
                this.controlsState.rotateCw = false; // Effect has no repeats, so it's done
            }
        }
    }
}

class SceneTargetTotals extends Phaser.Scene {

    targetTotals = new TargetTotals(); // Will be replaced with instance from create
    oldTargetTotals = new TargetTotals(); // If different, update text
    text1: Phaser.GameObjects.Text | undefined;
    text2: Phaser.GameObjects.Text | undefined;
    text3: Phaser.GameObjects.Text | undefined;

    constructor(config: Phaser.Types.Scenes.SettingsConfig) {
        super(config);
    }

    preload(): void {
        this.load.image('target', 'assets/pics/target.png');
        this.cameras.main.setViewport(60, 350, 160, 210);
    }

    create(data: any): void {
        this.targetTotals = data.targetTotals ?? this.targetTotals;
        this.add.rectangle(80, 105, 200, 220, 0, 0.5);
        let cell1 = this.add.sprite(40, 44, 'target').setScale(0.125, 0.125).setTint(CELL_1_COLOR);
        let cell2 = this.add.sprite(40, 104, 'target').setScale(0.125, 0.125).setTint(CELL_2_COLOR);
        let cell3 = this.add.sprite(40, 164, 'target').setScale(0.125, 0.125).setTint(CELL_3_COLOR);
        this.tweens.add({
            targets: [cell1, cell2, cell3],
            angle: 360,
            repeat: -1,
            duration: 1000
        });

        this.text1 = this.add.text(35, 25, '0', { fontSize: '30px', fontFamily: 'Sans-Serif', fontStyle: 'bold', color: '#fff', stroke: '#000', strokeThickness: 5, align: 'right', fixedWidth: 100 });
        this.text2 = this.add.text(35, 85, '0', { fontSize: '30px', fontFamily: 'Sans-Serif', fontStyle: 'bold', color: '#fff', stroke: '#000', strokeThickness: 5, align: 'right', fixedWidth: 100 });
        this.text3 = this.add.text(35, 145, '0', { fontSize: '30px', fontFamily: 'Sans-Serif', fontStyle: 'bold', color: '#fff', stroke: '#000', strokeThickness: 5, align: 'right', fixedWidth: 100 });
    }

    update(time: number, delta: number): void {
        if (this.oldTargetTotals.cell1 != this.targetTotals.cell1) {
            this.oldTargetTotals.cell1 = this.targetTotals.cell1;
            this.text1?.setText(this.targetTotals.cell1.toString());
        }
        if (this.oldTargetTotals.cell2 != this.targetTotals.cell2) {
            this.oldTargetTotals.cell2 = this.targetTotals.cell2;
            this.text2?.setText(this.targetTotals.cell2.toString());
        }
        if (this.oldTargetTotals.cell3 != this.targetTotals.cell3) {
            this.oldTargetTotals.cell3 = this.targetTotals.cell3;
            this.text3?.setText(this.targetTotals.cell3.toString());
        }
    }
}

class SceneNextCells extends Phaser.Scene {

    leftCell: Phaser.GameObjects.Sprite | undefined;
    rightCell: Phaser.GameObjects.Sprite | undefined;

    constructor(config: Phaser.Types.Scenes.SettingsConfig) {
        super(config);
    }

    preload(): void {
        this.load.image('joined', 'assets/pics/joined.png');
        this.cameras.main.setViewport(575, 38, 160, 100);
    }

    create(data: GameThingies): void {
        this.add.rectangle(0, 0, 320, 200, 0, 0.5);
        this.add.text(0, 10, 'NEXT', { fontSize: '20px', fontFamily: 'Sans-Serif', fontStyle: 'bold', color: '#fff', stroke: '#000', strokeThickness: 4, align: 'center', fixedWidth: 160 });
        this.leftCell = this.add.sprite(64, 64, 'joined');
        this.leftCell.setScale(0.125, 0.125);
        this.rightCell = this.add.sprite(96, 64, 'joined');
        this.rightCell.setScale(0.125, 0.125);
        this.rightCell.flipX = true;

        data.boardEvents.on('newNext', this.handler, this);
    }

    update(time: number, delta: number): void {
    }

    handler(leftCellType: integer, rightCellType: integer): void {
        this.leftCell?.setTint(getCellColor(leftCellType));
        this.rightCell?.setTint(getCellColor(rightCellType));
    }
}

class SceneLevelInfo extends Phaser.Scene {

    levelText: Phaser.GameObjects.Text | undefined;

    constructor(config: Phaser.Types.Scenes.SettingsConfig) {
        super(config);
    }

    preload(): void {
        this.cameras.main.setViewport(575, 160, 160, 88);
    }

    create(data: GameThingies): void {
        this.add.rectangle(0, 0, 320, 176, 0, 0.5);
        this.add.text(0, 10, 'LEVEL', { fontSize: '20px', fontFamily: 'Sans-Serif', fontStyle: 'bold', color: '#fff', stroke: '#000', strokeThickness: 4, align: 'center', fixedWidth: 160 });
        this.levelText = this.add.text(0, 40, '0', { fontSize: '30px', fontFamily: 'Sans-Serif', fontStyle: 'bold', color: '#fff', stroke: '#000', strokeThickness: 5, align: 'center', fixedWidth: 160 });

        data.boardEvents.on('newBoard', this.handler, this);
    }

    update(time: number, delta: number): void {
    }

    handler(level: integer): void {
        this.levelText?.setText(level.toString());
    }
}

class SceneGrid extends Phaser.Scene {
    tickDuration = 1000 / 60;
    ticks: number = 0;
    ticksLeftover: number = 0; // sometimes a little extra or a little less delta is between updates.

    gameThingies: GameThingies | undefined;
    gameState = GAME_STATE_PREGAME;
    gridRows = 17;
    gridCols = 8;
    grid: integer[] = Array(this.gridRows * this.gridCols);
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

    gridDisplay: (Phaser.GameObjects.Sprite | null)[] = Array(this.gridRows * this.gridCols);
    cellsActiveDisplay: (Phaser.GameObjects.Sprite | null)[] = Array();

    colToX(col: integer): integer {
        // cols go from left (0) to right (7)
        return col * 32 + 16;
    }

    rowToY(row: integer): integer {
        // rows go from bottom (0) to top (15), which is reverse of how pixels are done.
        return 544 - (row * 32 + 16);
    }

    cellToScene(row: integer, col: integer, cellValue: integer): Phaser.GameObjects.Sprite | null {
        let sprite: Phaser.GameObjects.Sprite;
        // cols go from left (0) to right (7)
        let xPos = this.colToX(col);
        // rows go from bottom (0) to top (15), which is reverse of how pixels are done.
        let yPos = this.rowToY(row);
        if (cellValue == 0) {
            return null;
        } else if ((cellValue & CELL_TARGET) > 0) {
            sprite = this.add.sprite(xPos, yPos, 'target');
            this.tweens.add({
                targets: sprite,
                angle: 360,
                repeat: -1,
                duration: 1000
            })
        } else if ((cellValue & CELL_JOINED_RIGHT) > 0) {
            sprite = this.add.sprite(xPos, yPos, 'joined');
        } else if ((cellValue & CELL_JOINED_LEFT) > 0) {
            sprite = this.add.sprite(xPos, yPos, 'joined');
            sprite.flipX = true;
        } else if ((cellValue & CELL_JOINED_TOP) > 0) {
            sprite = this.add.sprite(xPos, yPos, 'joined');
            sprite.setRotation(Math.PI / 2);
            sprite.flipX = true;
        } else if ((cellValue & CELL_JOINED_BOTTOM) > 0) {
            sprite = this.add.sprite(xPos, yPos, 'joined');
            sprite.setRotation(Math.PI / 2);
        } else {
            sprite = this.add.sprite(xPos, yPos, 'filled')
        }
        sprite.setScale(0.125, 0.125);

        let color = 0xffffff;
        if ((CELL_TYPE_MASK & cellValue) == 1) {
            color = CELL_1_COLOR;
        } else if ((CELL_TYPE_MASK & cellValue) == 2) {
            color = CELL_2_COLOR;
        } else if ((CELL_TYPE_MASK & cellValue) == 3) {
            color = CELL_3_COLOR;
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
            join1 = CELL_JOINED_RIGHT;
            join2 = CELL_JOINED_LEFT;
        } else if (rotation == 1) {
            // In 1st rotation, first cell is above, second cell is at row and col.
            row += 1 - index;
            join1 = CELL_JOINED_BOTTOM;
            join2 = CELL_JOINED_TOP;
        } else if (rotation == 2) {
            // In 2nd rotation, first cell is to the right, second cell is at row and col.
            col += 1 - index;
            join1 = CELL_JOINED_LEFT;
            join2 = CELL_JOINED_RIGHT;
        } else if (rotation == 3) {
            // In 3rd rotation, first cell is at row and col, second cell is above.
            row += index;
            join1 = CELL_JOINED_TOP;
            join2 = CELL_JOINED_BOTTOM;
        }

        // Use the correct join depending on which active cell we're looking at
        cellValue &= CELL_TYPE_MASK;
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

    gridGet(row: number, col: number): integer {
        let index = row * this.gridCols + col;
        return this.grid[index];
    }

    gridSet(row: number, col: number, cellValue: integer) {
        let index = row * this.gridCols + col;
        let oldCell = this.grid[index];
        if (oldCell != cellValue) {
            this.grid[index] = cellValue;
            let sprite = this.gridDisplay[index];
            if (sprite != null) {
                sprite.destroy();
            }
            this.gridDisplay[index] = this.cellToScene(row, col, cellValue);
        }
    }

    gridMove(row: number, col: number, rowChange: number, colChange: number) {
        let sourceIndex = row * this.gridCols + col;
        let targetIndex = (row + rowChange) * this.gridCols + col + colChange;
        let sourceCell = this.grid[sourceIndex];
        let oldTargetCell = this.grid[targetIndex];
        if (oldTargetCell != CELL_EMPTY) {
            let sprite = this.gridDisplay[targetIndex];
            sprite?.destroy();
        }
        this.grid[targetIndex] = sourceCell;
        this.grid[sourceIndex] = CELL_EMPTY;
        this.gridDisplay[targetIndex] = this.gridDisplay[sourceIndex];
        this.gridDisplay[sourceIndex] = null;
        this.gridDisplay[targetIndex]?.setPosition(this.colToX(col + colChange), this.rowToY(row + rowChange));
    }

    // Deletes the cell at the location, and "unjoins" any cells joined to that cell.
    gridDelete(fancy: boolean, row: number, col: number): integer {
        let old = this.gridGet(row, col);
        // If cell is connected above, remove that cell's respective join.
        if ((old & CELL_JOINED_TOP) != 0) {
            this.gridSet(row + 1, col, this.gridGet(row + 1, col) & ~CELL_JOINED_BOTTOM);
        }
        // If cell is connected right, remove that cell's respective join.
        if ((old & CELL_JOINED_RIGHT) != 0) {
            this.gridSet(row, col + 1, this.gridGet(row, col + 1) & ~CELL_JOINED_LEFT);
        }
        // If cell is connected below, remove that cell's respective join.
        if ((old & CELL_JOINED_BOTTOM) != 0) {
            this.gridSet(row - 1, col, this.gridGet(row - 1, col) & ~CELL_JOINED_TOP);
        }
        // If cell is connected left, remove that cell's respective join.
        if ((old & CELL_JOINED_LEFT) != 0) {
            this.gridSet(row, col - 1, this.gridGet(row, col - 1) & ~CELL_JOINED_RIGHT);
        }

        // Fancy delete the given cell
        let index = row * this.gridCols + col;
        let oldCell = this.grid[index];
        if (oldCell != CELL_EMPTY) {
            this.grid[index] = CELL_EMPTY;
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

    constructor(config?: Phaser.Types.Core.GameConfig) {
        super(config ?? { key: 'SceneGrid', active: true });

        for (let i = 0; i < this.gridRows * this.gridCols; ++i) {
            this.grid[i] = CELL_EMPTY;
            this.gridDisplay[i] = null;
        }
    }

    cellsActiveCanMove(posRow: number, posCol: number, rotation: number): boolean {
        // NOTE: It may be possible to rotate if the active cells can shift left one

        let legit = true;

        // If horizontal, check at pos and to the right.
        if (rotation % 2 == 0) {
            legit = legit && (posRow >= 0) && (posRow <= this.gridRows - 1)
                && (posCol >= 0) && (posCol <= this.gridCols - 2);
            legit = legit
                && this.grid[(posRow * this.gridCols) + posCol] == CELL_EMPTY
                && this.grid[(posRow * this.gridCols) + posCol + 1] == CELL_EMPTY;
        } else {
            // If vertical, check at pos and above.
            legit = legit && (posRow >= 0) && (posRow <= this.gridRows - 2)
                && (posCol >= 0) && (posCol <= this.gridCols - 1);
            legit = legit
                && this.grid[(posRow * this.gridCols) + posCol] == CELL_EMPTY
                && this.grid[((posRow + 1) * this.gridCols) + posCol] == CELL_EMPTY;
        }

        return legit;
    }

    activeSet(): void {
        this.cellsActive.forEach((cell, index) => {
            let abs = this.cellActiveGetPosAbsolute(this.activePosRow, this.activePosCol, this.activeRotation, index, cell);
            this.gridSet(abs[0], abs[1], abs[2]);
        });

        // Clear the grid's topmost row of cells, as cells shouldn't be set there
        for (let col = 0; col < this.gridCols; ++col) {
            this.gridDelete(false, this.gridRows - 1, col);
        }

        // Delete the active sprites
        while (this.cellsActiveDisplay.length) {
            this.cellsActiveDisplay.shift()?.destroy();
        }
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
                let currType = cell & CELL_TYPE_MASK;
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
                let currType = cell & CELL_TYPE_MASK;
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

    receivedRotateCcw(): void {
        this.rotate(-1);
    }

    receivedRotateCw(): void {
        this.rotate(1);
    }

    rotate(amount: integer): void {
        // Can only rotate when active cell is in play
        if (this.gameState != GAME_STATE_ACTIVE) {
            return;
        }

        // If the proposed rotation will not clobber a filled cell, then allow it, but if rotating
        // from a vertical position to a horizontal one and it would clobber a filled cell,
        // try kicking left one col. If no clobbers, then go with that.
        let rotation = 3 - ((3 - ((this.activeRotation + amount) % 4)) % 4)
        let posCol = this.activePosCol;
        if (!this.cellsActiveCanMove(this.activePosRow, posCol, rotation) && (rotation % 2) == 0) {
            --posCol;
        }
        if (this.cellsActiveCanMove(this.activePosRow, posCol, rotation)) {
            this.activeRotation = rotation;
            this.activePosCol = posCol;

            // Update display
            // Delete the current sprites then create new ones at correct position
            while (this.cellsActiveDisplay.length) {
                this.cellsActiveDisplay.shift()?.destroy();
            }
            this.cellsActive.forEach((cell, index) => this.cellsActiveDisplay.push(this.cellActiveToScene(this.activePosRow, this.activePosCol, this.activeRotation, index, cell)));
        }
    }

    // Drop (by one) all cells that are not settled.
    dropDanglingCells(): boolean {
        let dropped = false; // if at least one cell dropped by gravity, the function will need to run again.
        let dropline = new Array<boolean>(this.gridCols); // Calculate drops for an entire line before dropping.
        // Work from the bottom up (well, not the bottom-most row though)
        for (let row = 1; row < this.gridRows; ++row) {
            for (let col = 0; col < this.gridCols; ++col) {
                let nodrop = false; // If nodrop is true, do not drop the cell.
                let cell = this.gridGet(row, col);

                // If the cell is empty, do not drop.
                nodrop ||= cell == CELL_EMPTY;
                // If the cell is a target, do not drop
                nodrop ||= (cell & CELL_TARGET) > 0;
                // If the cell below this cell is occupied, do not drop this cell.
                nodrop ||= (this.gridGet(row - 1, col) != CELL_EMPTY);
                // If the cell is joined right, and the cell below that is occupied, don't drop.
                nodrop ||= ((cell & CELL_JOINED_RIGHT) != 0 && this.gridGet(row - 1, col + 1) != CELL_EMPTY);
                // If the cell is joined left, and the cell below that is occupied, don't drop.
                nodrop ||= ((cell & CELL_JOINED_LEFT) != 0 && this.gridGet(row - 1, col - 1) != CELL_EMPTY);

                dropline[col] = !nodrop;
            }
            // Now that each column has been calculated to drop or not, drop the correct parts of the line
            for (let col = 0; col < this.gridCols; ++col) {
                let shouldDrop = dropline[col];
                dropped ||= shouldDrop;
                if (shouldDrop) {
                    this.gridMove(row, col, -1, 0);
                }
            }
        }

        return dropped;
    }

    sameType(cell: integer, ...cells: integer[]): boolean {
        return cells.every(c => (c & CELL_TYPE_MASK) == (cell & CELL_TYPE_MASK));
    }

    canPlaceTarget(row: number, col: number, cell: integer): boolean {
        // If the placement would collide with a filled cell, then the answer is no.
        if (this.gridGet(row, col) != CELL_EMPTY) {
            return false;
        }

        // If the placement results in three or more consecutive targets of the same type, then
        // it cannot be placed there.
        let cellType = cell & CELL_TYPE_MASK;

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

    startup(data: GameThingies): void {
        if (this.gameThingies?.controlsEvents != data.controlsEvents) {
            data.controlsEvents.on('rotateccw', this.receivedRotateCcw, this);
            data.controlsEvents.on('rotatecw', this.receivedRotateCw, this);
        }

        this.gameThingies = data;
        this.gameState = GAME_STATE_PREGAME;
        this.grid.forEach((item, i, arr) => arr[i] = CELL_EMPTY);
        this.level = data.gameSettings.level ?? 0;
        let level = LEVELS[Math.min(this.level, 20)];
        let numTargets = level.numTargets;
        this.targetTotals = data.targetTotals ?? this.targetTotals;
        this.gameThingies.boardEvents.emit('newBoard', this.level);
        this.add.rectangle(128, 272, 256, 544, 0, 0.5);
        this.cellsNext.length = 0;
        this.cellsNext.push(CELL_TYPES[Math.floor(Math.random() * CELL_TYPES.length)]);
        this.cellsNext.push(CELL_TYPES[Math.floor(Math.random() * CELL_TYPES.length)]);
        this.gameThingies.boardEvents.emit('newNext', this.cellsNext[0], this.cellsNext[1]);
        // Add some targets on the board
        let maxRow = level.highestRow;
        for (let i = 0; i < numTargets; ++i) {
            let row = Math.floor(Math.random() * maxRow);
            let col = Math.floor(Math.random() * (this.gridCols));
            let target = CELL_TYPES[Math.floor(Math.random() * CELL_TYPES.length)] | CELL_TARGET;
            let placed = false;
            for (let attempts = 0; attempts < maxRow * this.gridCols; ++attempts) {
                if (this.canPlaceTarget(row, col, target)) {
                    this.gridSet(row, col, target);
                    if ((target & CELL_TYPE_MASK) == CELL_1) {
                        ++this.targetTotals.cell1;
                    } else if ((target & CELL_TYPE_MASK) == CELL_2) {
                        ++this.targetTotals.cell2;
                    } else if ((target & CELL_TYPE_MASK) == CELL_3) {
                        ++this.targetTotals.cell3;
                    }
                    break;
                }
                ++col;
                if (col >= this.gridCols) {
                    col = 0;
                    --row;
                    if (row < 0) {
                        row = maxRow - 1;
                    }
                }
            }
        }

        // Init the active cells
        this.activePosRow = this.startRow;
        this.activePosCol = this.startCol;
        this.activeRotation = 0;
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
            switch (this.gameState) {
                case GAME_STATE_PREGAME: {
                    // This is normally used to set up the board, but it kinda already is,
                    // so we do nothing but start the game... for now.
                    this.gameState = GAME_STATE_RELEASING;
                    break;
                }
                case GAME_STATE_RELEASING: {
                    if (this.releaseCounter == 0) {
                        // TODO Find better place for getting next cell colors.
                        this.cellsActive.length = 0;
                        this.cellsActive.push(this.cellsNext[0], this.cellsNext[1]);
                        this.cellsNext.length = 0;
                        this.cellsNext.push(CELL_TYPES[Math.floor(Math.random() * CELL_TYPES.length)]);
                        this.cellsNext.push(CELL_TYPES[Math.floor(Math.random() * CELL_TYPES.length)]);
                        this.gameThingies?.boardEvents.emit('newNext', this.cellsNext[0], this.cellsNext[1]);
                    }
                    if (this.releaseCounter < 45) {
                        ++this.releaseCounter;
                    } else {
                        this.releaseCounter = 0;

                        // If any of the cells where the active cells are placed is filled, then game over.
                        // (still place the active cells anyway, to show why)
                        let start1 = this.gridGet(this.startRow, this.startCol);
                        let start2 = this.gridGet(this.startRow, this.startCol + 1);

                        this.gameState = GAME_STATE_ACTIVE;

                        // position and display the active cells
                        this.activePosRow = this.startRow;
                        this.activePosCol = this.startCol;
                        this.activeRotation = 0;
                        this.cellsActive.forEach((cell, index) => this.cellsActiveDisplay.push(this.cellActiveToScene(this.activePosRow, this.activePosCol, this.activeRotation, index, cell)));

                        if (start1 != CELL_EMPTY || start2 != CELL_EMPTY) {
                            this.gameState = GAME_STATE_DONE_LOST;
                        }
                    }
                    break;
                }
                case GAME_STATE_ACTIVE: {
                    this.activeStateUpdate();
                    break;
                }
                case GAME_STATE_SETTLE: {
                    ++this.settleCounter;
                    if (this.settleCounter % 15 == 0) {
                        if (!this.dropDanglingCells()) {
                            // TODO: This should not be instant.
                            let seriesToClear = this.getCellsToClear();
                            seriesToClear.forEach(series => series.forEach(cell => {
                                let deleted = this.gridDelete(true, ...cell);
                                // Decrement the counter corresponding to the target cleared.
                                if ((deleted & CELL_TARGET) != 0) {
                                    let deletedType = deleted & CELL_TYPE_MASK;
                                    if (deletedType == CELL_1) {
                                        --this.targetTotals.cell1;
                                    } else if (deletedType == CELL_2) {
                                        --this.targetTotals.cell2;
                                    } else if (deletedType == CELL_3) {
                                        --this.targetTotals.cell3;
                                    }
                                }
                            }));

                            // If all the targets are gone, then the level is cleared.
                            if (this.targetTotals.cell1 + this.targetTotals.cell2 + this.targetTotals.cell3 < 1) {
                                this.gameState = GAME_STATE_DONE_WON;
                            }

                            // If nothing was cleared, then release the next active piece.
                            if (seriesToClear.length == 0) {
                                this.settleCounter = 0;
                                this.gameState = GAME_STATE_RELEASING;
                            }
                        }
                    }
                    break;
                }
                case GAME_STATE_DONE_LOST: {
                    // TODO: This should not be instant.
                    if (!this.scene.isActive("SceneLevelLostr")) {
                        this.scene.run("SceneLevelLost")
                    }
                    break;
                }
                case GAME_STATE_DONE_WON: {
                    // TODO: This should not be instant.
                    if (!this.scene.isActive("SceneLevelClear")) {
                        this.scene.run("SceneLevelClear")
                    }
                    break;
                }
            }
            ++this.ticks;
        }
    }

    activeStateUpdate(): void {

        ++this.dropCounter;

        let changed = false;
        let shouldSettle = false;

        if (this.gameThingies?.controlsState.leftPressed) {
            // If the active cells can go left, then go.
            if (repeaty(this.gameThingies?.controlsState.leftPressedTicks, SHIFT_TICKS_REPEAT_DELAY, SHIFT_TICKS_REPEAT_RATE)
                && this.cellsActiveCanMove(this.activePosRow, this.activePosCol - 1, this.activeRotation)) {
                --this.activePosCol;
                changed = true;
            }
        }
        if (this.gameThingies?.controlsState.rightPressed) {
            // If the active cells can go right, then go.
            if (repeaty(this.gameThingies?.controlsState.rightPressedTicks, SHIFT_TICKS_REPEAT_DELAY, SHIFT_TICKS_REPEAT_RATE)
                && this.cellsActiveCanMove(this.activePosRow, this.activePosCol + 1, this.activeRotation)) {
                ++this.activePosCol;
                changed = true;
            }
        }
        if (this.gameThingies?.controlsState.shovePressed) {
            // If the active cells can go down, then go.
            if (repeaty(this.gameThingies?.controlsState.shovePressedTicks, SHOVE_TICKS_REPEAT_DELAY, SHOVE_TICKS_REPEAT_DELAY)) {
                if (this.cellsActiveCanMove(this.activePosRow - 1, this.activePosCol, this.activeRotation)) {
                    --this.activePosRow;
                    changed = true;
                    this.dropCounter = 0;
                } else {
                    shouldSettle = true;
                }
            }
        }

        if (this.dropCounter >= this.dropRate) {
            this.dropCounter = 0;
            if (this.cellsActiveCanMove(this.activePosRow - 1, this.activePosCol, this.activeRotation)) {
                --this.activePosRow;
            } else {
                shouldSettle = true;
            }
            changed = true;
        }

        if (shouldSettle) {
            this.activeSet();
            this.gameState = GAME_STATE_SETTLE;
            changed = true;
        }

        // Update the positions of the active cells if anything changed
        if (changed) {
            this.cellsActiveDisplay.forEach((sprite: Phaser.GameObjects.Sprite | null, index) =>
                this.cellActiveUpdatePos(this.activePosRow, this.activePosCol, this.activeRotation, index, sprite));
        }
    }
}

function repeaty(ticksActive: number, ticksRepeatDelay: number, ticksRepeatRate: number): boolean {
    return ticksActive == 0
        || ticksActive == ticksRepeatDelay
        || (
            ticksActive > ticksRepeatDelay
            && ((ticksActive - ticksRepeatDelay) % ticksRepeatRate) == 0
        );
}

let config = {
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
let gameThingies: GameThingies = { gameSettings: gameSettings, targetTotals: counter, controlsState: new ControlsState(), controlsEvents: new Phaser.Events.EventEmitter(), boardEvents: new Phaser.Events.EventEmitter() };

GAME.scene.add('SceneBackground', SceneBackground, true);
GAME.scene.add('SceneTargetTotals', SceneTargetTotals, true, { targetTotals: counter });
GAME.scene.add('SceneNextCells', SceneNextCells, true, gameThingies);
GAME.scene.add('SceneLevelInfo', SceneLevelInfo, true, gameThingies);
GAME.scene.add('Controls', GameControls, true, gameThingies);
GAME.scene.add('SceneGrid', SceneGrid, true, gameThingies);
GAME.scene.add('SceneMultitouch', SceneMultitouch, true, gameThingies);
GAME.scene.add('SceneLevelClear', SceneLevelClear, false, gameThingies);
GAME.scene.add('SceneLevelLost', SceneLevelLost, false);
