import {EventEmitter} from 'events';
import Dispatcher from './dispatcher';
import {Kind, ActionType} from './actions';

export interface Size {
    lines: number;
    cols: number;
}

export interface Cursor {
    line: number;
    col: number;
}

export interface Color {
    fg: string;
    bg: string;
}

export class NeovimStore extends EventEmitter {
    dispatch_token: string;

    size: Size;
    color: Color;
    cursor: Cursor;
    mode: string;
    busy: boolean;

    constructor() {
        super();
        this.size = {
            lines: 0,
            cols: 0,
        };
        this.color = {
            fg: 'white',
            bg: 'black',
        };
        this.cursor = {
            line: 0,
            col: 0,
        };
        this.mode = 'normal';
        this.busy = false;
    }
}

const store = new NeovimStore();
export default store;

function colorString(new_color: number, fallback: string) {
    if (!new_color || new_color === -1) {
        return fallback;
    }
    return '#' + new_color.toString(16);
}

store.dispatch_token = Dispatcher.register((action: ActionType) => {
    switch(action.type) {
        case Kind.PutText:
            store.emit('put', action.text, store.cursor);
            store.cursor.col = store.cursor.col + action.text.length;
            store.emit('cursor', store.cursor);
            break;
        case Kind.Cursor:
            store.cursor = {
                line: action.line,
                col: action.col,
            };
            store.emit('cursor', store.cursor);
            break;
        case Kind.Highlight:
            console.log('Kind.Highlight is ignored');
            break;
        case Kind.ClearAll:
            store.emit('clear-all');
            store.cursor = {
                line: 0,
                col: 0,
            };
            store.emit('cursor', store.cursor);
            break;
        case Kind.ClearEOL:
            store.emit('clear-eol', store.cursor);
            break;
        case Kind.Resize:
            store.size = {
                lines: action.lines,
                cols: action.cols,
            };
            store.emit('resize', store.size);
            break;
        case Kind.UpdateFG:
            store.color.fg = colorString(action.color, store.color.fg);
            store.emit('update-fg', store.color);
            break;
        case Kind.UpdateBG:
            store.color.bg = colorString(action.color, store.color.bg);
            store.emit('update-bg', store.color);
            break;
        case Kind.Mode:
            store.mode = action.mode;
            store.emit('mode', store.mode);
            break;
        case Kind.BusyStart:
            store.busy = true;
            store.emit('busy', store.busy);
            break;
        case Kind.BusyStop:
            store.busy = false;
            store.emit('busy', store.busy);
            break;
        default:
            console.log('Unhandled action: ', action);
            break;
    }
});
