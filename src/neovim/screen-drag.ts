import NeovimStore from './store';
import log from '../log';

const MouseButtonKind = [ 'Left', 'Middle', 'Right' ];

export default class ScreenDrag {
    line: number;
    col: number;

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
    }

    start(down_event: MouseEvent) {
        down_event.preventDefault();
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
        return [
            Math.floor(e.clientY / this.store.font_attr.height),
            Math.floor(e.clientX / this.store.font_attr.width),
        ];
    }
}
