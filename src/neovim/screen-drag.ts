import NeovimStore from './store';
import log from '../log';

const MouseButtonKind = [ 'Left', 'Middle', 'Right' ];

export default class ScreenDrag {
    line: number;
    col: number;
    parentX: number;
    parentY: number;

    static buildInputOf(e: MouseEvent, type: string, line: number, col: number) {
        let seq = '<';
        if (e.ctrlKey) {
            seq += 'C-';
        }
        if (e.altKey) {
            seq += 'A-';
        }
        if (e.shiftKey) {
            seq += 'S-';
        }
        seq += MouseButtonKind[e.button] + type + '>';
        seq += `<${col},${line}>`;
        return seq;
    }

    constructor(private store: NeovimStore) {
        this.line = 0;
        this.col = 0;
        this.parentX = 0;
        this.parentY = 0;
    }

    start(down_event: MouseEvent) {
        const wrapper: HTMLElement = this.store.dom.container;
        if (wrapper !== null) {
            const rect = (down_event.target as HTMLCanvasElement).getBoundingClientRect();
            this.parentY = rect.top;
            this.parentX = rect.left;
        }
        [this.line, this.col] = this.getPos(down_event);
        log.info('Drag start', down_event, this.line, this.col);
        const input = ScreenDrag.buildInputOf(down_event, 'Mouse', this.line, this.col);
        log.debug('Mouse input: ' + input);
        return input;
    }

    drag(move_event: MouseEvent) {
        const [line, col] = this.getPos(move_event);
        if (line === this.line && col === this.col) {
            return null;
        }
        move_event.preventDefault();
        log.debug('Drag continue', move_event, line, col);
        const input = ScreenDrag.buildInputOf(move_event, 'Drag', line, col);
        this.line = line;
        this.col = col;
        log.debug('Mouse input: ' + input);
        return input;
    }

    end(up_event: MouseEvent) {
        up_event.preventDefault();

        [this.line, this.col] = this.getPos(up_event);
        log.info('Drag end', up_event, this.line, this.col);

        const input = ScreenDrag.buildInputOf(up_event, 'Release', this.line, this.col);
        log.info('Mouse input: ' + input);
        return input;
    }

    private getPos(e: MouseEvent) {
        // Note:
        // e.offsetX and e.offsetY is not available. On mouseup event, the cursor is under the mouse
        // pointer becase mousedown event moves the cursor under mouse pointer. In the case, e.target
        // is a cursor <canvas> element. And offset is calculated based on the cursor element.
        // So we need to have a screen element's position (parentX and parentY) and calculate offsets
        // based on it.
        const offsetY = e.clientY - this.parentY;
        const offsetX = e.clientX - this.parentX;
        return [
            Math.floor(offsetY / this.store.font_attr.height),
            Math.floor(offsetX / this.store.font_attr.width),
        ];
    }
}
