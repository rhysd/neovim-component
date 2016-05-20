import NeovimStore from './store';
import log from '../log';

// Note: Mouse has its origin at left-bottom
//
//   +y
//    |
//    |
//    |
//    |
//    |--------- +x

// Note:
// Vim handles scroll with 3 lines and 6 columns as one scroll
// :help <ScrollWheelUp>

export default class ScreenWheel {
    x: number;
    y: number;
    line: number;
    col: number;
    shift: boolean;
    ctrl: boolean;

    constructor(private store: NeovimStore) {
        this.reset();
    }

    handleEvent(e: WheelEvent) {
        if ((this.shift === undefined && this.ctrl === undefined) ||
            (this.shift !== e.shiftKey || this.ctrl !== e.ctrlKey)) {
            // Note:
            // Initialize at first or reset on modifier change
            this.reset(e.shiftKey, e.ctrlKey);
        }

        this.x += e.deltaX;
        this.y += e.deltaY;

        const scroll_x = Math.round(this.x / this.store.font_attr.draw_width / 6);
        const scroll_y = Math.round(this.y / this.store.font_attr.draw_height / 3);

        if (scroll_x === 0 && scroll_y === 0) {
            // Note: At least 3 lines or 6 columns are needed to scroll screen
            return '';
        }

        this.line = Math.floor(e.y / this.store.font_attr.height);
        this.col  = Math.floor(e.x / this.store.font_attr.width);

        const input = this.getInput(scroll_x, scroll_y);
        log.debug(`Scroll (${scroll_x}, ${scroll_y})`);
        this.reset();
        return input;
    }

    private reset(shift: boolean = undefined, ctrl: boolean = undefined) {
        this.x = 0;
        this.y = 0;
        this.shift = shift;
        this.ctrl = ctrl;
    }

    private getDirection(scroll_x: number, scroll_y: number) {
        if (scroll_y !== 0) {
            return scroll_y > 0 ? 'Down' : 'Up';
        } else if (scroll_x !== 0) {
            return scroll_x > 0 ? 'Left' : 'Right';
        } else {
            // Note: Never reach here
            log.error('Null scrolling');
            return '';
        }
    }

    private getInput(scroll_x: number, scroll_y: number) {
        let seq = '<';
        if (this.ctrl) {
            seq += 'C-';
        }
        if (this.shift) {
            seq += 'S-';
        }
        seq += `ScrollWheel${this.getDirection(scroll_x, scroll_y)}>`;
        seq += `<${this.col},${this.line}>`; // This is really needed?
        return seq;
    }
}
