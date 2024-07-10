/// <reference path="types/phaser.d.ts"/>

export const SHIFT_TICKS_DELAY = 15;
export const SHIFT_TICKS_RATE = 6;
export const SHOVE_TICKS = 2;

export interface Repeater {
    shouldFire(time: number, delta: number): boolean;
    released: boolean;
}

export class SingleFire implements Repeater {
    fired: boolean = false;
    released: boolean = true;

    shouldFire(time: number, delta: number): boolean {
        this.fired = true;
        return this.fired;
    }
}

export class RepeatFire implements Repeater {
    released: boolean = false;
    ticksHeld: number = 0;
    delay: number = 0;
    repeatRate: number = 0;

    constructor(delay: number, repeatRate: number) {
        this.delay = delay;
        this.repeatRate = repeatRate;
    }

    repeaty(ticksActive: number, ticksRepeatDelay: number, ticksRepeatRate: number): boolean {
        return ticksActive == 0
            || ticksActive == ticksRepeatDelay
            || (
                ticksActive > ticksRepeatDelay
                && ((ticksActive - ticksRepeatDelay) % ticksRepeatRate) == 0
            );
    }

    shouldFire(time: number, delta: number): boolean {
        // TODO: This probably should be based on actual time and delta, rather
        // than how often it was called.
        const fire = this.repeaty(this.ticksHeld, this.delay, this.repeatRate);
        ++this.ticksHeld;
        return fire;
    }

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
export class GameControls extends Phaser.Scene {

    #events: Phaser.Events.EventEmitter = new Phaser.Events.EventEmitter(); // To be overwritten by create.
    #activated: Record<string, Repeater> = {}; // key: the control, value: the number of ticks held.

    constructor(config: Phaser.Types.Scenes.SettingsConfig) {
        super(config);
    }

    preload(): void {
    }

    create(controlsEvents: Phaser.Events.EventEmitter): void {
        this.#events = controlsEvents;
        if (this.input.keyboard !== null) {
            let cursors = this.input.keyboard.createCursorKeys();
            cursors.space.on('down', () => this.#events.emit("down", "rotateCcw", new SingleFire()), this);
            cursors.up.on('down', () => this.#events.emit("down", "rotateCw", new SingleFire()), this);
            cursors.left.on('down', () => this.#events.emit("down", "left", new RepeatFire(SHIFT_TICKS_DELAY, SHIFT_TICKS_RATE)), this);
            cursors.left.on('up', () => this.#events.emit("up", "left"), this);
            cursors.right.on('down', () => this.#events.emit("down", "right", new RepeatFire(SHIFT_TICKS_DELAY, SHIFT_TICKS_RATE)), this);
            cursors.right.on('up', () => this.#events.emit("up", "right"), this);
            cursors.down.on('down', () => this.#events.emit("down", "shove", new RepeatFire(SHOVE_TICKS, SHOVE_TICKS)), this);
            cursors.down.on('up', () => this.#events.emit("up", "shove"), this);
        }

        this.#events.on("down", this.receivedDown, this);
        this.#events.on("up", this.receivedUp, this);
    }

    receivedDown(action: string, repeater: Repeater): void {
        // Only add if it isn't already in the map, because if there were two
        // different inputs to the same action, and both inputs were activated
        // at different times, the later of the two would "reset" the repeater
        // counter, which we don't want.
        if (!(action in this.#activated)) {
            this.#activated[action] = repeater;
        }
    }

    receivedUp(action: string): void {
        // We do not delete it here, but later at the update. Among other
        // effects, this allows a single down/up combo in a single tick to
        // still fire the action.
        if (action in this.#activated) {
            this.#activated[action].released = true;
        }
    }

    update(time: number, delta: number): void {
        for (const [k, v] of Object.entries(this.#activated)) {
            if (v !== null && typeof v.shouldFire === 'function') {
                if (v.shouldFire(time, delta)) {
                    this.#events.emit("action", k);
                }
                if (v.released) {
                    delete this.#activated[k];
                }
            }
        }
    }
}
