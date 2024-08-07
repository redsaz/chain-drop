import * as consts from "consts";
import { SingleFire, RepeatFire, SHIFT_TICKS_DELAY, SHIFT_TICKS_RATE, SHOVE_TICKS } from "controls";
import { GameThingies, TargetTotals } from "game";

export class SceneBackground extends Phaser.Scene {

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

export class SceneMultitouch extends Phaser.Scene {

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

        let left = this.add.sprite(100, 300, 'target').setScale(0.75, 0.75).setTint(consts.CELL_1_COLOR).setAlpha(alpha);
        this.btns.push(left);
        let right = this.add.sprite(300, 300, 'target').setScale(0.75, 0.75).setTint(consts.CELL_2_COLOR).setAlpha(alpha);
        this.btns.push(right);
        let shove = this.add.sprite(200, 500, 'target').setScale(0.75, 0.75).setTint(0x00ffff).setAlpha(alpha);
        this.btns.push(shove);
        let rotateCcw = this.add.sprite(500, 500, 'target').setScale(0.75, 0.75).setTint(consts.CELL_3_COLOR).setAlpha(alpha);
        this.btns.push(rotateCcw);
        let rotateCw = this.add.sprite(700, 500, 'target').setScale(0.75, 0.75).setTint(0xffff00).setAlpha(alpha);
        this.btns.push(rotateCw);

        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => this.pointer(pointer));
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => this.pointer(pointer));
        this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => this.pointer(pointer));
        // cursors.space.on('down', () => this.#events.emit("down", "rotateCcw", new SingleFire()), this);
        // cursors.up.on('down', () => this.#events.emit("down", "rotateCw", new SingleFire()), this);
        // cursors.left.on('down', () => this.#events.emit("down", "left", new RepeatFire(SHIFT_TICKS_DELAY, SHIFT_TICKS_RATE)), this);
        // cursors.left.on('up', () => this.#events.emit("up", "left"), this);
        // cursors.right.on('down', () => this.#events.emit("down", "right", new RepeatFire(SHIFT_TICKS_DELAY, SHIFT_TICKS_RATE)), this);
        // cursors.right.on('up', () => this.#events.emit("up", "right"), this);
        // cursors.down.on('down', () => this.#events.emit("down", "shove", new RepeatFire(SHOVE_TICKS, SHOVE_TICKS)), this);
        // cursors.down.on('up', () => this.#events.emit("up", "shove"), this);

        left.on(this.press, (pointer: Phaser.Input.Pointer) => {
            left.setTint(0xffffff);
            this.controlsEvents.emit("down", "left", new RepeatFire(SHIFT_TICKS_DELAY, SHIFT_TICKS_RATE));
        });
        left.on(this.release, (pointer: Phaser.Input.Pointer) => {
            left.setTint(consts.CELL_1_COLOR);
            this.controlsEvents.emit("up", "left");
        });

        right.on(this.press, (pointer: Phaser.Input.Pointer) => {
            right.setTint(0xffffff);
            this.controlsEvents.emit("down", "right", new RepeatFire(SHIFT_TICKS_DELAY, SHIFT_TICKS_RATE));
        });
        right.on(this.release, (pointer: Phaser.Input.Pointer) => {
            right.setTint(consts.CELL_2_COLOR);
            this.controlsEvents.emit("up", "right");
        });

        shove.on(this.press, (pointer: Phaser.Input.Pointer) => {
            shove.setTint(0xffffff);
            this.controlsEvents.emit("down", "shove", new RepeatFire(SHOVE_TICKS, SHOVE_TICKS));
        });
        shove.on(this.release, (pointer: Phaser.Input.Pointer) => {
            shove.setTint(0x00ffff);
            this.controlsEvents.emit("up", "shove");
        });

        rotateCcw.on(this.press, (pointer: Phaser.Input.Pointer) => {
            rotateCcw.setTint(0xffffff);
            this.controlsEvents.emit("down", "rotateCcw", new SingleFire());
        });
        rotateCcw.on(this.release, (pointer: Phaser.Input.Pointer) => {
            rotateCcw.setTint(consts.CELL_3_COLOR);
        });

        rotateCw.on(this.press, (pointer: Phaser.Input.Pointer) => {
            rotateCw.setTint(0xffffff);
            this.controlsEvents.emit("down", "rotateCw", new SingleFire());
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

// Displays the menu at the conclusion of a level
// (like, a button to the next level if won, or a button to retry or go to game menu)
export class SceneLevelDoneMenu extends Phaser.Scene {

    controlsEvents = new Phaser.Events.EventEmitter();
    gameThingies: GameThingies | undefined;

    constructor(config: Phaser.Types.Scenes.SettingsConfig) {
        super(config);
    }

    preload(): void {
        let stroke = 4;
        let half_stroke = stroke / 2;
        let xPos = 281;
        let width = 236;
        let yPos = 422;
        let height = 150;
        let rounding = 16;

        let graphics = this.add.graphics();
        let text = this.add.text(xPos, yPos + (height / 2) - 26, 'NEXT', { fixedWidth: width, fontSize: '32px', fontFamily: 'Sans-Serif', fontStyle: 'bold', color: '#fff', stroke: '#000', strokeThickness: 10, align: 'center' });
        let box = this.add.zone(xPos + (width / 2), yPos + (height / 2), width, height);
        this.drawButton(graphics, text, xPos, yPos, width, height);
        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            // If the press event was outside the button, then how button appears will not change
            // even if the pointer moves over the button. We can leave early.
            if (!box.getBounds().contains(pointer.downX, pointer.downY)) {
                return;
            }

            let oldPos = pointer.prevPosition;
            // If pressed, and position *was* outside the button but is now in the button, then show the button pressed.
            if (pointer.primaryDown && box.getBounds().contains(pointer.x, pointer.y) && !box.getBounds().contains(oldPos.x, oldPos.y)) {
                this.drawButtonPressing(graphics, text, xPos, yPos, width, height);
            } else if (pointer.primaryDown && !box.getBounds().contains(pointer.x, pointer.y) && box.getBounds().contains(oldPos.x, oldPos.y)) {
                // else, if pressed and position *was* in the button but is now outside the button, then show the button unpressed.
                this.drawButton(graphics, text, xPos, yPos, width, height);
            }
        })
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (box.getBounds().contains(pointer.downX, pointer.downY)) {
                this.drawButtonPressing(graphics, text, xPos, yPos, width, height);
            }
        });
        this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
            // If the pointer was pressed on the button, and released on the button,
            // then activate the button.
            if (box.getBounds().contains(pointer.x, pointer.y) && box.getBounds().contains(pointer.downX, pointer.downY)) {
                this.goNext();
            }
            this.drawButton(graphics, text, xPos, yPos, width, height);
        });
        this.input.keyboard?.addKey(13, false, false).on('down', this.goNext, this);
        this.input.keyboard?.addKey(32, false, false).on('down', this.goNext, this);
    }

    create(data: GameThingies): void {
        this.gameThingies = data;
    }

    update(time: number, delta: number): void {
    }

    // Move on from this screen
    goNext(): void {
        if (this.gameThingies != undefined) {
            this.gameThingies.gameSettings.level++;
        }
        this.scene.get('SceneGrid').scene.restart();
        this.scene.get('SceneLevelClear').scene.stop();
        this.scene.stop(this.scene.key);
    }

    drawButton(graphics: Phaser.GameObjects.Graphics, text: Phaser.GameObjects.Text, xPos: number, yPos: number, width: number, height: number) {
        let stroke = 4;
        let half_stroke = stroke / 2;
        let rounding = 16;

        graphics.clear();
        graphics.fillStyle(0x555555, 1).fillRoundedRect(xPos + half_stroke, yPos + half_stroke, width - stroke, height - stroke, rounding);
        graphics.fillGradientStyle(0x555555, 0x555555, 0x999999, 0x999999).fillRect(xPos + half_stroke, yPos + half_stroke + 10, width, (height - 20 - stroke) / 2);
        graphics.fillGradientStyle(0x999999, 0x999999, 0x555555, 0x555555).fillRect(xPos + half_stroke, yPos + half_stroke + ((height - 10) / 2), width - stroke, (height - 20 - stroke) / 2);
        graphics.lineStyle(stroke, 0xaaaaaa, 1).strokeRoundedRect(xPos + half_stroke, yPos + half_stroke, width - stroke, height - stroke, rounding);

        text.setY(yPos + (height / 2) - 26);
    }

    drawButtonPressing(graphics: Phaser.GameObjects.Graphics, text: Phaser.GameObjects.Text, xPos: number, yPos: number, width: number, height: number) {
        let stroke = 4;
        let half_stroke = stroke / 2;
        let rounding = 16;

        graphics.clear();
        graphics.fillStyle(0x999999, 1).fillRoundedRect(xPos + half_stroke, yPos + half_stroke, width - stroke, height - stroke, rounding);
        graphics.fillGradientStyle(0x999999, 0x999999, 0x555555, 0x555555).fillRect(xPos + half_stroke, yPos + half_stroke + 10, width, (height - 20 - stroke) / 2);
        graphics.fillGradientStyle(0x555555, 0x555555, 0x999999, 0x999999).fillRect(xPos + half_stroke, yPos + half_stroke + ((height - 10) / 2), width - stroke, (height - 20 - stroke) / 2);
        graphics.lineStyle(stroke, 0xeeeeee, 1).strokeRoundedRect(xPos + half_stroke, yPos + half_stroke, width - stroke, height - stroke, rounding);

        text.setY(yPos + (height / 2) - 25);
    }

}

export class SceneLevelClear extends Phaser.Scene {

    gameThingies: GameThingies | undefined;

    constructor(config: Phaser.Types.Scenes.SettingsConfig) {
        super(config);
    }

    preload(): void {
        var text = this.add.text(400, 300, 'CLEAR!', { fontSize: '66px', fontFamily: 'Sans-Serif', fontStyle: 'bold', color: '#fff', stroke: '#000', strokeThickness: 10, align: 'center' });
        text.setX(this.cameras.default.centerX - (text.width / 2));
        text.setY(this.cameras.default.centerY - (text.height / 2));
    }

    create(data: GameThingies): void {
        this.gameThingies = data;
    }

    update(time: number, delta: number): void {
    }

}

export class SceneLevelLost extends Phaser.Scene {

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

export class SceneTargetTotals extends Phaser.Scene {

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
        let cell1 = this.add.sprite(40, 44, 'target').setScale(0.125, 0.125).setTint(consts.CELL_1_COLOR);
        let cell2 = this.add.sprite(40, 104, 'target').setScale(0.125, 0.125).setTint(consts.CELL_2_COLOR);
        let cell3 = this.add.sprite(40, 164, 'target').setScale(0.125, 0.125).setTint(consts.CELL_3_COLOR);
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

export class SceneNextCells extends Phaser.Scene {

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
        this.leftCell?.setTint(this.getCellColor(leftCellType));
        this.rightCell?.setTint(this.getCellColor(rightCellType));
    }

    getCellColor(cellValue: integer): integer {
        let color = 0xffffff;
        if ((consts.CELL_TYPE_MASK & cellValue) == 1) {
            color = consts.CELL_1_COLOR;
        } else if ((consts.CELL_TYPE_MASK & cellValue) == 2) {
            color = consts.CELL_2_COLOR;
        } else if ((consts.CELL_TYPE_MASK & cellValue) == 3) {
            color = consts.CELL_3_COLOR;
        }
        return color;
    }
}

export class SceneLevelInfo extends Phaser.Scene {

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
