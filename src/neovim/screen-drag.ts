import Store from './store';
import log from '../log';
import Dispatcher from './dispatcher';
import {inputToNeovim} from './actions';

const MouseButtonKind = [ 'Left', 'Middle', 'Right' ];

export default class ScreenDrag {
    line: number;
    col: number;

    static getLine(y: number) {
        return Math.floor(y / Store.font_attr.height);
    }

    static getCol(x: number) {
        return Math.floor(x / Store.font_attr.width);
    }

    static buildInputOf(e: MouseEvent, type: string, line: number, col: number) {
        let seq = '<';
        if (e.shiftKey) {
            seq += 'S-';
        }
        if (e.ctrlKey) {
            seq += 'C-';
        }
        if (e.altKey) {
            seq += 'A-';
        }
        seq += MouseButtonKind[e.button] + type + '>';
        return seq;
    }

    constructor(down_event: MouseEvent) {
        down_event.preventDefault();
        this.line = ScreenDrag.getLine(down_event.clientY);
        this.col = ScreenDrag.getCol(down_event.clientX);
        log.info('Drag start', down_event, this.line, this.col);
        const input = ScreenDrag.buildInputOf(down_event, 'Mouse', this.line, this.col) + `<${this.col},${this.line}>`;
        Dispatcher.dispatch(inputToNeovim(input))
        log.debug('Mouse input: ' + input);
    }

    drag(move_event: MouseEvent) {
        move_event.preventDefault();
        const line = ScreenDrag.getLine(move_event.clientY);
        const col = ScreenDrag.getCol(move_event.clientX);
        if (line !== this.line || col !== this.col) {
            log.debug('Drag continue', move_event, line, col);
            const input = ScreenDrag.buildInputOf(move_event, 'Drag', line, col) + `<${col},${line}>`;
            Dispatcher.dispatch(inputToNeovim(input))
            log.debug('Mouse input: ' + input);
            this.line = line;
            this.col = col;
        }
    }

    // XXX: Is this method not needed?
    end(up_event: MouseEvent) {
        up_event.preventDefault();
        // this.line = ScreenDrag.getLine(up_event.clientY);
        // this.col = ScreenDrag.getCol(up_event.clientX);

        this.line = ScreenDrag.getLine(up_event.clientY);
        this.col = ScreenDrag.getCol(up_event.clientX);
        log.info('Drag end', up_event, this.line, this.col);

        const input = ScreenDrag.buildInputOf(up_event, 'Release', this.line, this.col) + `<${this.col},${this.line}>`;
        Dispatcher.dispatch(inputToNeovim(input))
        log.info('Mouse input: ' + input);
        console.error(input);
    }
}
