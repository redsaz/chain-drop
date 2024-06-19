export const CELL_TYPE_MASK = 0b0000_0111;
export const CELL_EMPTY = 0b0000_0000;
export const CELL_JOINED_TOP = 0b0001_0000;
export const CELL_JOINED_RIGHT = 0b0010_0000;
export const CELL_JOINED_BOTTOM = 0b0100_0000;
export const CELL_JOINED_LEFT = 0b1000_0000;
export const CELL_TARGET = 0b0000_1000;
export const CELL_1 = 0b0000_0001;
export const CELL_2 = 0b0000_0010;
export const CELL_3 = 0b0000_0011;
export const CELL_1_COLOR = 0xff0000;
export const CELL_2_COLOR = 0x00ff00;
export const CELL_3_COLOR = 0x4466ff;

export const CELL_TYPES = [CELL_1, CELL_2, CELL_3];

export const SHIFT_TICKS_REPEAT_DELAY = 15;
export const SHIFT_TICKS_REPEAT_RATE = 6;
export const SHOVE_TICKS_REPEAT_DELAY = 2;

// TODO: This is not a const. Yet it is in the consts module. The module needs
// renamed, or better yet, reworked to not even exist.
export function repeaty(ticksActive: number, ticksRepeatDelay: number, ticksRepeatRate: number): boolean {
    return ticksActive == 0
        || ticksActive == ticksRepeatDelay
        || (
            ticksActive > ticksRepeatDelay
            && ((ticksActive - ticksRepeatDelay) % ticksRepeatRate) == 0
        );
}
