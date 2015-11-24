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

export interface FontAttributes {
    fg: string;
    bg: string;
    bold: boolean;
    italic: boolean;
    reverse: boolean;
    underline: boolean;
    undercurl: boolean;
}

export class NeovimStore extends EventEmitter {
    dispatch_token: string;

    size: Size;
    font_attr: FontAttributes;
    fg_color: string;
    bg_color: string;
    cursor: Cursor;
    mode: string;
    busy: boolean;

    constructor() {
        super();
        this.size = {
            lines: 0,
            cols: 0,
        };
        this.font_attr = {
            fg: 'white',
            bg: 'black',
            bold: false,
            italic: false,
            reverse: false,
            underline: false,
            undercurl: false,
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
            store.emit('put', action.text, store.cursor, store.font_attr);
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
            const hl = action.highlight;
            store.font_attr.bold = hl.bold;
            store.font_attr.italic = hl.italic;
            store.font_attr.reverse = hl.reverse;
            store.font_attr.underline = hl.underline;
            store.font_attr.fg = colorString(hl.foreground, store.fg_color)
            store.font_attr.bg = colorString(hl.background, store.bg_color)
            if (hl.background) {
            }
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
            store.fg_color = colorString(action.color, store.font_attr.fg);
            store.emit('update-fg', store.fg_color);
            break;
        case Kind.UpdateBG:
            store.bg_color = colorString(action.color, store.font_attr.bg);
            store.emit('update-bg', store.bg_color);
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
