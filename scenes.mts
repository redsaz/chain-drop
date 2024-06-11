import * as consts from "consts";
import {GameThingies} from "game";

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

        left.on(this.press, (pointer: Phaser.Input.Pointer) => {
            left.setTint(0xffffff);
            this.controlsEvents.emit('_internal_leftpressed');
        });
        left.on(this.release, (pointer: Phaser.Input.Pointer) => {
            left.setTint(consts.CELL_1_COLOR);
            this.controlsEvents.emit('_internal_leftreleased');
        });

        right.on(this.press, (pointer: Phaser.Input.Pointer) => {
            right.setTint(0xffffff);
            this.controlsEvents.emit('_internal_rightpressed');
        });
        right.on(this.release, (pointer: Phaser.Input.Pointer) => {
            right.setTint(consts.CELL_2_COLOR);
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
            rotateCcw.setTint(consts.CELL_3_COLOR);
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
