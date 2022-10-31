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

const cell_type_mask = 0b0000_0111;
const cell_empty = 0b0000_0000;
const cell_joined_top = 0b0001_0000;
const cell_joined_right = 0b0010_0000;
const cell_joined_bottom = 0b0100_0000;
const cell_joined_left = 0b1000_0000;
const cell_target = 0b0000_1000;
const cell_1 = 0b0000_0001;
const cell_2 = 0b0000_0010;
const cell_3 = 0b0000_0011;

const shift_ticks_repeat_delay = 15;
const shift_ticks_repeat_rate = 6;
const shove_ticks_repeat_delay = 2;

const game_state_pregame = 1; // Game hasn't started yet (counting down, whatever)
const game_state_releasing = 2; // The active cells are preparing into the grid
const game_state_active = 3; // The player can control the active cells
const game_state_settle = 4; // The active cells have been set, and possibly cleared and gravity needs to affect the board.
const game_state_done_lost = 5; // The game is finished, the player lost.
const game_state_done_won = 6; // The game is finished, the player won.

class SceneGrid extends Phaser.Scene {
    cursors: Phaser.Types.Input.Keyboard.CursorKeys | undefined;
    debugText: Phaser.GameObjects.Text | undefined;

    tick_duration = 1000 / 60;
    ticks: number = 0;
    ticks_leftover: number = 0; // sometimes a little extra or a little less delta is between updates.

    game_state = game_state_pregame;
    grid_rows = 16;
    grid_cols = 8;
    grid: integer[] = Array(this.grid_rows * this.grid_cols);
    start_row = 15;
    start_col = 3;
    active_pos_row = 0;
    active_pos_col = 0;
    active_rotation = 0;
    cells_active: integer[] = Array();
    drop_counter = 0;
    drop_rate = 40;
    release_counter = 0;
    settle_counter = 0;

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
        } else if ((cell_value & cell_target) > 0) {
            sprite = this.add.sprite(x_pos, y_pos, 'target');
            this.tweens.add({
                targets: sprite,
                angle: 360,
                repeat: -1,
                duration: 1000
            })
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

        let color = 0xffffff;
        if ((cell_type_mask & cell_value) == 1) {
            color = 0xff0000;
        } else if ((cell_type_mask & cell_value) == 2) {
            color = 0x00ff00;
        } else if ((cell_type_mask & cell_value) == 3) {
            color = 0x4466ff;
        }
        sprite.setTint(color);

        return sprite;
    }

    cell_active_to_scene(row: integer, col: integer, rotation: integer, index: number, cell_value: integer): Phaser.GameObjects.Sprite | null {
        let abs = this.cell_active_get_pos_absolute(row, col, rotation, index, cell_value);
        return this.cell_to_scene(abs[0], abs[1], abs[2]);
    }

    cell_active_get_pos_absolute(row: integer, col: integer, rotation: integer, index: number, cell_value: integer): [integer, integer, integer] {
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
        cell_value &= cell_type_mask;
        if (index == 0) {
            cell_value |= join1;
        } else {
            cell_value |= join2;
        }
        return [row, col, cell_value];
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
        sprite.setPosition(this.col_to_x(col), this.row_to_y(row) + 4);
    }

    grid_get(row: number, col: number): integer {
        let index = row * this.grid_cols + col;
        return this.grid[index];
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

    // Deletes the cell at the location, and "unjoins" any cells joined to that cell.
    grid_delete(row: number, col: number) {
        let old = this.grid_get(row, col);
        // If cell is connected above, remove that cell's respective join.
        if ((old & cell_joined_top) != 0) {
            this.grid_set(row + 1, col, this.grid_get(row + 1, col) & ~cell_joined_bottom);
        }
        // If cell is connected right, remove that cell's respective join.
        if ((old & cell_joined_right) != 0) {
            this.grid_set(row, col + 1, this.grid_get(row, col + 1) & ~cell_joined_left);
        }
        // If cell is connected below, remove that cell's respective join.
        if ((old & cell_joined_bottom) != 0) {
            this.grid_set(row - 1, col, this.grid_get(row - 1, col) & ~cell_joined_top);
        }
        // If cell is connected left, remove that cell's respective join.
        if ((old & cell_joined_left) != 0) {
            this.grid_set(row, col - 1, this.grid_get(row, col - 1) & ~cell_joined_right);
        }
        this.grid_set(row, col, cell_empty);
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

    active_set() {
        this.cells_active.forEach((cell, index) => {
            let abs = this.cell_active_get_pos_absolute(this.active_pos_row, this.active_pos_col, this.active_rotation, index, cell);
            this.grid_set(abs[0], abs[1], abs[2]);
        });

        // Delete the active sprites
        while (this.cells_active_display.length) {
            this.cells_active_display.shift()?.destroy();
        }

        // TODO: This should not be instant.
        let series_to_clear = this.get_cells_to_clear();
        console.log("Series to clear: " + series_to_clear.length);
        series_to_clear.forEach(series => series.forEach(cell => this.grid_delete(...cell)));
    }

    // Returns sets of cells to clear from the board (but doesn't clear them itself).
    // Only settled cells are considered for clearing.
    get_cells_to_clear(): [integer, integer][][] {
        let sets_to_clear: [integer, integer][][] = [];
        // Find any horizontal clears
        for (let row = 0; row < this.grid_rows; ++row) {
            let series_type = 0;
            let series_length = 0;
            for (let col = 0; col < this.grid_cols; ++col) {
                let cell = this.grid_get(row, col);
                let curr_type = cell & cell_type_mask;
                if (curr_type == series_type) {
                    ++series_length;
                } else {
                    // If series is long enough, add cols to clear
                    if (series_type != 0 && series_length >= 4) {
                        let cells_to_clear: [integer, integer][] = [];
                        for (let i = col - series_length; i < col; ++i) {
                            cells_to_clear.push([row, i]);
                        }
                        sets_to_clear.push(cells_to_clear);
                    }

                    series_type = curr_type;
                    series_length = 1;
                }
            }
            // Must check at end of each row if there is a series long enough to clear.
            // If series is long enough, add cols to clear
            if (series_type != 0 && series_length >= 4) {
                let cells_to_clear: [integer, integer][] = [];
                for (let i = this.grid_cols - series_length; i < this.grid_cols; ++i) {
                    cells_to_clear.push([row, i]);
                }
                sets_to_clear.push(cells_to_clear);
            }
        }

        // Find any vertical clears
        for (let col = 0; col < this.grid_cols; ++col) {
            let series_type = 0;
            let series_length = 0;
            for (let row = 0; row < this.grid_rows; ++row) {
                let cell = this.grid_get(row, col);
                let curr_type = cell & cell_type_mask;
                if (curr_type == series_type) {
                    ++series_length;
                } else {
                    // If series is long enough, add rows to clear
                    if (series_type != 0 && series_length >= 4) {
                        let cells_to_clear: [integer, integer][] = [];
                        for (let i = row - series_length; i < row; ++i) {
                            cells_to_clear.push([i, col]);
                        }
                        sets_to_clear.push(cells_to_clear);
                    }

                    series_type = curr_type;
                    series_length = 1;
                }
            }
            // Must check at end of each col if there is a series long enough to clear.
            // If series is long enough, add rows to clear
            if (series_type != 0 && series_length >= 4) {
                let cells_to_clear: [integer, integer][] = [];
                for (let i = this.grid_rows - series_length; i < this.grid_rows; ++i) {
                    cells_to_clear.push([i, col]);
                }
                sets_to_clear.push(cells_to_clear);
            }
        }
        return sets_to_clear;
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

    // For debugging purposes only, this isn't actually part of the game.
    received_set(): void {
        this.active_set();
        this.game_state = game_state_settle;
    }

    // Drop (by one) all cells that are not settled.
    drop_dangling_cells(): boolean {
        let dropped = false; // if at least one cell dropped by gravity, the function will need to run again.
        let dropline = new Array<boolean>(this.grid_cols); // Calculate drops for an entire line before dropping.
        // Work from the bottom up (well, not the bottom-most row though)
        for (let row = 1; row < this.grid_rows; ++row) {
            for (let col = 0; col < this.grid_cols; ++col) {
                let nodrop = false; // If nodrop is true, do not drop the cell.
                let cell = this.grid_get(row, col);

                // If the cell is empty, do not drop.
                nodrop ||= cell == cell_empty;
                // If the cell is a target, do not drop
                nodrop ||= (cell & cell_target) > 0;
                // If the cell below this cell is occupied, do not drop this cell.
                nodrop ||= (this.grid_get(row - 1, col) != cell_empty);
                // If the cell is joined right, and the cell below that is occupied, don't drop.
                nodrop ||= ((cell & cell_joined_right) != 0 && this.grid_get(row - 1, col + 1) != cell_empty);
                // If the cell is joined left, and the cell below that is occupied, don't drop.
                nodrop ||= ((cell & cell_joined_left) != 0 && this.grid_get(row - 1, col - 1) != cell_empty);

                dropline[col] = !nodrop;
            }
            // Now that each column has been calculated to drop or not, drop the correct parts of the line
            for (let col = 0; col < this.grid_cols; ++col) {
                let should_drop = dropline[col];
                dropped ||= should_drop;
                if (should_drop) {
                    let cell = this.grid_get(row, col);
                    this.grid_set(row - 1, col, cell);
                    this.grid_set(row, col, cell_empty);
                }
            }
        }

        return dropped;
    }

    preload(): void {
        this.load.image('target', 'assets/pics/target.png');
        this.load.image('joined', 'assets/pics/joined.png');
        this.load.image('filled', 'assets/pics/filled.png');
        this.cameras.main.setViewport(272, 70, 256, 512)
    }

    create(): void {
        this.add.rectangle(128, 256, 256, 512, 0, 0.5)
        this.debugText = this.add.text(4, 4, 'NNN', { font: '20px Sans-Serif', color: '#000' });

        // Add some obstacles on the board
        this.grid_set(0, 0, cell_1 | cell_target);
        this.grid_set(1, 3, cell_2 | cell_target);
        this.grid_set(5, 7, cell_3 | cell_target);

        // Init the active cells
        this.active_pos_row = this.start_row;
        this.active_pos_col = this.start_col;
        this.active_rotation = 0;
        this.cells_active.push(cell_1, cell_2)

        if (this.input.keyboard !== null) {
            this.cursors = this.input.keyboard.createCursorKeys();
            this.cursors.space.on('down', this.received_rotate, this);
            this.cursors.shift.on('down', this.received_set, this);
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
            switch (this.game_state) {
                case game_state_pregame: {
                    // This is normally used to set up the board, but it kinda already is,
                    // so we do nothing but start the game... for now.
                    this.game_state = game_state_releasing;
                    break;
                }
                case game_state_releasing: {
                    if (this.release_counter < 45) {
                        ++this.release_counter;
                    } else {
                        this.release_counter = 0;

                        // position and display the active cells
                        this.active_pos_row = this.start_row;
                        this.active_pos_col = this.start_col;
                        this.active_rotation = 0;
                        this.cells_active.forEach((cell, index) => this.cells_active_display.push(this.cell_active_to_scene(this.active_pos_row, this.active_pos_col, this.active_rotation, index, cell)));

                        this.game_state = game_state_active;
                    }
                    break;
                }
                case game_state_active: {
                    this.active_state_update();
                    break;
                }
                case game_state_settle: {
                    ++this.settle_counter;
                    if (this.settle_counter % 15 == 0) {
                        if (!this.drop_dangling_cells()) {
                            // TODO: This should not be instant.
                            let series_to_clear = this.get_cells_to_clear();
                            series_to_clear.forEach(series => series.forEach(cell => this.grid_delete(...cell)));

                            if (series_to_clear.length == 0) {
                                this.settle_counter = 0;
                                this.game_state = game_state_releasing;
                            }
                        }
                    }
                    break;
                }
                case game_state_done_lost: {
                    break;
                }
                case game_state_done_won: {
                    break;
                }
            }
            ++this.ticks;
        }

        if (this.debugText != undefined) {
            let state_text = "unknown";
            switch (this.game_state) {
                case game_state_pregame: {
                    state_text = "pregame";
                    break;
                }
                case game_state_releasing: {
                    state_text = "releasing";
                    break;
                }
                case game_state_active: {
                    state_text = "active";
                    break;
                }
                case game_state_settle: {
                    state_text = "settle";
                    break;
                }
                case game_state_done_lost: {
                    state_text = "game over";
                    break;
                }
                case game_state_done_won: {
                    state_text = "win";
                    break;
                }
            }

            this.debugText.setText("time: " + time + "\ndelta: " + delta + "\nticks: " + this.ticks + "\nticks_leftover: " + this.ticks_leftover + "\n" + this.active_pos_row + "," + this.active_pos_col + "," + this.active_rotation + "\n" + this.game_state + ": " + state_text);
        }
    }

    active_state_update(): void {

        ++this.drop_counter;

        let changed = false;
        let should_settle = false;

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
                if (repeaty(this.ticks_pressing_shove, shove_ticks_repeat_delay, shove_ticks_repeat_delay)) {
                    if (this.cells_active_can_move(this.active_pos_row - 1, this.active_pos_col, this.active_rotation)) {
                        --this.active_pos_row;
                        changed = true;
                        this.drop_counter = 0;
                    } else {
                        should_settle = true;
                    }
                }
                ++this.ticks_pressing_shove;
            } else {
                this.ticks_pressing_shove = 0;
            }
        }

        if (this.drop_counter >= this.drop_rate) {
            this.drop_counter = 0;
            if (this.cells_active_can_move(this.active_pos_row - 1, this.active_pos_col, this.active_rotation)) {
                --this.active_pos_row;
            } else {
                should_settle = true;
            }
            changed = true;
        }

        if (should_settle) {
            this.active_set();
            this.game_state = game_state_settle;
            changed = true;
        }

        // Update the positions of the active cells if anything changed
        if (changed) {
            this.cells_active_display.forEach((sprite: Phaser.GameObjects.Sprite | null, index) =>
                this.cell_active_update_pos(this.active_pos_row, this.active_pos_col, this.active_rotation, index, sprite));
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
