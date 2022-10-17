/// <reference path="types/phaser.d.ts"t/>

class SceneBackground extends Phaser.Scene {

    constructor() {
        super({ key: 'SceneBackground', active: true });
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

const cell_types_filter = 0b0000_1111;
const cell_empty = 0b0000_0000;
const cell_joined_top = 0b0001_0000;
const cell_joined_right = 0b0010_0000;
const cell_joined_bottom = 0b0100_0000;
const cell_joined_left = 0b1000_0000;
const cell_1 = 0b0000_0001;
const cell_2 = 0b0000_0010;
const cell_3 = 0b0000_0011;

const shift_ticks_repeat_delay = 15;
const shift_ticks_repeat_rate = 6;
const shove_ticks_repeat_delay = 2;

class SceneGrid extends Phaser.Scene {
    cursors: Phaser.Types.Input.Keyboard.CursorKeys | undefined;
    debugText: Phaser.GameObjects.Text | undefined;

    tick_duration = 1000 / 60;
    ticks: number = 0;
    ticks_leftover: number = 0; // sometimes a little extra or a little less delta is between updates.

    grid_rows = 16;
    grid_cols = 8;
    grid: integer[] = Array(this.grid_rows * this.grid_cols);
    active_pos_row = 0;
    active_pos_col = 0;
    active_rotation = 0;
    cells_active: integer[] = Array();

    grid_display: (Phaser.GameObjects.Sprite | null)[] = Array(this.grid_rows * this.grid_cols);
    cells_active_display: (Phaser.GameObjects.Sprite | null)[] = Array();

    // How many ticks the button for the action has been pressed.
    ticks_pressing_shove = 0;
    ticks_pressing_left = 0;
    ticks_pressing_right = 0;


    col_to_x(col: integer): integer {
        // cols go from left (0) to right (7)
        return col * 32 + 16;
    }

    row_to_y(row: integer): integer {
        // rows go from bottom (0) to top (15), which is reverse of how pixels are done.
        return 512 - (row * 32 + 16);
    }

    cell_to_scene(row: integer, col: integer, cell_value: integer): Phaser.GameObjects.Sprite | null {
        let sprite: Phaser.GameObjects.Sprite;
        // cols go from left (0) to right (7)
        let x_pos = this.col_to_x(col);
        // rows go from bottom (0) to top (15), which is reverse of how pixels are done.
        let y_pos = this.row_to_y(row);
        if (cell_value == 0) {
            return null;
        } else if ((cell_value & cell_joined_right) > 0) {
            sprite = this.add.sprite(x_pos, y_pos, 'joined');
        } else if ((cell_value & cell_joined_left) > 0) {
            sprite = this.add.sprite(x_pos, y_pos, 'joined');
            sprite.flipX = true;
        } else if ((cell_value & cell_joined_top) > 0) {
            sprite = this.add.sprite(x_pos, y_pos, 'joined');
            sprite.setRotation(Math.PI / 2);
            sprite.flipX = true;
        } else if ((cell_value & cell_joined_bottom) > 0) {
            sprite = this.add.sprite(x_pos, y_pos, 'joined');
            sprite.setRotation(Math.PI / 2);
        } else {
            sprite = this.add.sprite(x_pos, y_pos, 'filled')
        }
        sprite.setScale(0.125, 0.125);

        if ((cell_types_filter & cell_value) == 1) {
            sprite.setTint(0xff0000);
        } else if ((cell_types_filter & cell_value) == 2) {
            sprite.setTint(0x00ff00);
        } else if ((cell_types_filter & cell_value) == 3) {
            sprite.setTint(0x4466ff);
        }

        return sprite;
    }

    cell_active_to_scene(row: integer, col: integer, rotation: integer, index: number, cell_value: integer): Phaser.GameObjects.Sprite | null {
        // In 0th rotation, first cell is at the row and col, second cell is to the right.
        let join1 = 0;
        let join2 = 0;
        if (rotation == 0) {
            col += index;
            join1 = cell_joined_right;
            join2 = cell_joined_left;
        } else if (rotation == 1) {
            // In 1st rotation, first cell is at row and col, second cell is above.
            row += index;
            join1 = cell_joined_top;
            join2 = cell_joined_bottom;
        } else if (rotation == 2) {
            // In 2nd rotation, first cell is to the right, second cell is at row and col.
            col += 1 - index;
            join1 = cell_joined_left;
            join2 = cell_joined_right;
        } else if (rotation == 3) {
            // In 3rd rotation, first cell is above, second cell is at row and col.
            row += 1 - index;
            join1 = cell_joined_bottom;
            join2 = cell_joined_top;
        }

        // Use the correct join depending on which active cell we're looking at
        cell_value &= cell_types_filter;
        if (index == 0) {
            cell_value |= join1;
        } else {
            cell_value |= join2;
        }
        return this.cell_to_scene(row, col, cell_value);
    }

    cell_active_update_pos(row: integer, col: integer, rotation: integer, index: number, sprite: Phaser.GameObjects.Sprite | null): void {
        if (sprite == null) {
            return;
        }

        // In 0th rotation, first cell is at the row and col, second cell is to the right.
        let join1 = 0;
        let join2 = 0;
        if (rotation == 0) {
            col += index;
        } else if (rotation == 1) {
            // In 1st rotation, first cell is at row and col, second cell is above.
            row += index;
        } else if (rotation == 2) {
            // In 2nd rotation, first cell is to the right, second cell is at row and col.
            col += 1 - index;
        } else if (rotation == 3) {
            // In 3rd rotation, first cell is above, second cell is at row and col.
            row += 1 - index;
        }
        sprite.setPosition(this.col_to_x(col), this.row_to_y(row));
    }

    grid_set(row: number, col: number, cell_value: integer) {
        let index = row * this.grid_cols + col;
        let old_cell = this.grid[index];
        if (old_cell != cell_value) {
            this.grid[index] = cell_value;
            let sprite = this.grid_display[index];
            if (sprite != null) {
                sprite.destroy();
            }
            this.grid_display[index] = this.cell_to_scene(row, col, cell_value);
        }
    }

    constructor() {
        super({ key: 'SceneGrid', active: true });

        for (let i = 0; i < this.grid_rows * this.grid_cols; ++i) {
            this.grid[i] = cell_empty;
            this.grid_display[i] = null;
        }
    }

    cells_active_can_move(pos_row: number, pos_col: number, rotation: number): boolean {
        // NOTE: It may be possible to rotate if the active cells can shift left one

        let legit = true;

        // If horizontal, check at pos and to the right.
        if (rotation % 2 == 0) {
            legit = legit && (pos_row >= 0) && (pos_row <= this.grid_rows - 1)
                && (pos_col >= 0) && (pos_col <= this.grid_cols - 2);
            legit = legit
                && this.grid[(pos_row * this.grid_cols) + pos_col] == cell_empty
                && this.grid[(pos_row * this.grid_cols) + pos_col + 1] == cell_empty;
        } else {
            // If vertical, check at pos and above.
            legit = legit && (pos_row >= 0) && (pos_row <= this.grid_rows - 2)
                && (pos_col >= 0) && (pos_col <= this.grid_cols - 1);
            legit = legit
                && this.grid[(pos_row * this.grid_cols) + pos_col] == cell_empty
                && this.grid[((pos_row + 1) * this.grid_cols) + pos_col] == cell_empty;
        }

        return legit;
        // return this.cells_active.every((cell, index) => this.grid[(pos_row * this.grid_cols) + (pos_col + index)] == cell_empty);
    }

    received_rotate(): void {
        // If the active cells can rotate, then go
        let rotation = (this.active_rotation + 1) % 4
        if (this.cells_active_can_move(this.active_pos_row, this.active_pos_col, rotation)) {
            this.active_rotation = rotation;

            // Update display
            // Delete the current sprites then create new ones at correct position
            while (this.cells_active_display.length) {
                this.cells_active_display.shift()?.destroy();
            }
            this.cells_active.forEach((cell, index) => this.cells_active_display.push(this.cell_active_to_scene(this.active_pos_row, this.active_pos_col, this.active_rotation, index, cell)));
        }
    }

    preload(): void {
        this.load.image('joined', 'assets/pics/joined.png');
        this.load.image('filled', 'assets/pics/filled.png');
        this.cameras.main.setViewport(272, 70, 256, 512)
    }

    create(): void {
        this.add.rectangle(128, 256, 256, 512, 0, 0.5)
        this.debugText = this.add.text(4, 4, 'NNN', { font: '20px Sans-Serif', color: '#000' });

        // Add some obstacles on the board
        this.grid_set(0, 0, cell_1);
        this.grid_set(8, 3, cell_2);
        this.grid_set(15, 7, cell_3);

        // Add the active cells to board
        this.active_pos_row = 7;
        this.active_pos_col = 3;
        this.active_rotation = 0;
        this.cells_active.push(cell_1, cell_2)
        this.cells_active.forEach((cell, index) => this.cells_active_display.push(this.cell_active_to_scene(this.active_pos_row, this.active_pos_col, this.active_rotation, index, cell)));
        // this.grid_set(7, 3, cell_joined_right | cell_1)
        // this.grid_set(7, 4, cell_joined_left | cell_2)

        // this.cells_active.push([7, 3, cell_joined_bottom | cell_1], [6, 3, cell_joined_top | cell_3])
        // this.grid_set(7, 3, cell_joined_bottom | cell_1)
        // this.grid_set(6, 3, cell_joined_top | cell_3)
        if (this.input.keyboard !== null) {
            this.cursors = this.input.keyboard.createCursorKeys();
            this.cursors.space.on('down', this.received_rotate, this);
        }
    }

    update(time: number, delta: number): void {
        let ticks_and_fraction = (delta / this.tick_duration) + this.ticks_leftover;
        let ticks_to_update: number;
        // If not enough time has passed for a full tick, but for over half a tick, then
        // count it as a tick, but have a negative leftover value to indicate it's ahead.
        if (ticks_and_fraction < 1.0 && ticks_and_fraction > 0.5) {
            ticks_to_update = 1;
        } else {
            ticks_to_update = Math.floor(ticks_and_fraction);
        }
        this.ticks_leftover = ticks_and_fraction - ticks_to_update;

        for (let i = 0; i < ticks_to_update; ++i) {

            // TODO Every 2/3 sec (40 ticks) drop the active cells one row for slow,
            // Every 1/3 sec (20 ticks) drop one for normal,
            // Every 7/30 sec (14 ticks) drop one for fast
            // Shoving will reset this counter.

            // TODO For shifting left or right, if holding down the button,
            // initial repeat rate 1/4 sec (15 ticks) before the second shift, and then
            // a repeat rate of 1/10 sec (6 ticks) for every shift thereafter.

            // TODO For shoving down, if holding the button, repeat rate 1/30 sec (2 ticks)

            // There is no repeat rate for rotations.

            let changed = false;

            if (this.cursors !== undefined) {
                if (this.cursors.left.isDown) {
                    // If the active cells can go left, then go.
                    if (repeaty(this.ticks_pressing_left, shift_ticks_repeat_delay, shift_ticks_repeat_rate)
                        && this.cells_active_can_move(this.active_pos_row, this.active_pos_col - 1, this.active_rotation)) {
                        --this.active_pos_col;
                        changed = true;
                    }
                    ++this.ticks_pressing_left;
                } else {
                    this.ticks_pressing_left = 0;
                }
                if (this.cursors.right.isDown) {
                    // If the active cells can go right, then go.
                    if (repeaty(this.ticks_pressing_right, shift_ticks_repeat_delay, shift_ticks_repeat_rate)
                        && this.cells_active_can_move(this.active_pos_row, this.active_pos_col + 1, this.active_rotation)) {
                        ++this.active_pos_col;
                        changed = true;
                    }
                    ++this.ticks_pressing_right;
                } else {
                    this.ticks_pressing_right = 0;
                }
                if (this.cursors.up.isDown) {
                    // If the active cells can go up, then go.
                    // This action is for debug purposes only.
                    if (this.cells_active_can_move(this.active_pos_row + 1, this.active_pos_col, this.active_rotation)) {
                        ++this.active_pos_row;
                        changed = true;
                    }
                }
                if (this.cursors.down.isDown) {
                    // If the active cells can go down, then go.
                    if (repeaty(this.ticks_pressing_shove, shove_ticks_repeat_delay, shove_ticks_repeat_delay)
                        && this.cells_active_can_move(this.active_pos_row - 1, this.active_pos_col, this.active_rotation)) {
                        --this.active_pos_row;
                        changed = true;
                    }
                    ++this.ticks_pressing_shove;
                } else {
                    this.ticks_pressing_shove = 0;
                }

                // Update the positions of the active cells if anything changed
                if (changed) {
                    this.cells_active_display.forEach((sprite: Phaser.GameObjects.Sprite | null, index) =>
                        this.cell_active_update_pos(this.active_pos_row, this.active_pos_col, this.active_rotation, index, sprite));
                }
            }
            ++this.ticks;
        }
        if (this.debugText != undefined) {
            this.debugText.setText("time: " + time + "\ndelta: " + delta + "\nticks: " + this.ticks + "\nticks_leftover: " + this.ticks_leftover + "\n" + this.active_pos_row + "," + this.active_pos_col + "," + this.active_rotation);
        }
    }
}

function repeaty(ticks_active: number, ticks_repeat_delay: number, ticks_repeat_rate: number): boolean {
    return ticks_active == 0
        || ticks_active == ticks_repeat_delay
        || (
            ticks_active > ticks_repeat_delay
            && ((ticks_active - ticks_repeat_delay) % ticks_repeat_rate) == 0
        );
}

let config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'content',
    backgroundColor: '#253912',
    scene: [SceneBackground, SceneGrid]
};

const game = new Phaser.Game(config);
