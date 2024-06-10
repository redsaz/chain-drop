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
