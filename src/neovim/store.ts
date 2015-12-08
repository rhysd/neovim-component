import {EventEmitter} from 'events';
import Dispatcher from './dispatcher';
import {Kind, ActionType, Region} from './actions';
import log from '../log';
import ScreenDrag from './screen-drag';
import ScreenWheel from './screen-wheel';

// TODO:
// Debug log should be implemented as the subscriber of store
// and be controlled by registering it or not watching NODE_ENV variable.

export interface Size {
    lines: number;
    cols: number;
    width: number;
    height: number;
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
    width: number;
    height: number;
    face: string;
    specified_px: number;
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
    mouse_enabled: boolean;
    dragging: ScreenDrag;
    title: string;
    icon_path: string;
    wheel_scrolling: ScreenWheel;
    scroll_region: Region;

    constructor() {
        super();
        this.size = {
            lines: 0,
            cols: 0,
            width: 0,
            height: 0,
        };
        this.font_attr = {
            fg: 'white',
            bg: 'black',
            bold: false,
            italic: false,
            reverse: false,
            underline: false,
            undercurl: false,
            width: 1,
            height: 1,
            specified_px: 1,
            face: 'monospace',
        };
        this.cursor = {
            line: 0,
            col: 0,
        };
        this.mode = 'normal';
        this.busy = false;
        this.mouse_enabled = true;
        this.dragging = null;
        this.title = 'Neovim';  // TODO: This should be set by API.  I must implement it after making store non-singleton
        this.icon_path = '';
        this.wheel_scrolling = new ScreenWheel();
        this.scroll_region = {
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
        };
    }
}

const store = new NeovimStore();
export default store;

// Note: 0x001203 -> '#001203'
function colorString(new_color: number, fallback: string) {
    'use strict';
    if (typeof new_color !== 'number' || new_color < 0) {
        return fallback;
    }

    return '#' + [16, 8, 0].map(shift => {
        const mask = 0xff << shift;
        const hex = ((new_color & mask) >> shift).toString(16);
        return hex.length < 2 ? ('0' + hex) : hex;
    }).join('');
}

store.dispatch_token = Dispatcher.register((action: ActionType) => {
    switch (action.type) {
        case Kind.Input: {
            store.emit('input', action.input);
            break;
        }
        case Kind.PutText: {
            store.emit('put', action.text);
            store.cursor.col = store.cursor.col + action.text.length;
            store.emit('cursor');
            break;
        }
        case Kind.Cursor: {
            store.cursor = {
                line: action.line,
                col: action.col,
            };
            store.emit('cursor');
            break;
        }
        case Kind.Highlight: {
            const hl = action.highlight;
            store.font_attr.bold = hl.bold;
            store.font_attr.italic = hl.italic;
            store.font_attr.reverse = hl.reverse;
            store.font_attr.underline = hl.underline;
            store.font_attr.fg = colorString(hl.foreground, store.fg_color);
            store.font_attr.bg = colorString(hl.background, store.bg_color);
            log.debug('Highlight is updated: ', store.font_attr);
            break;
        }
        case Kind.Focus: {
            store.emit('focus');
            break;
        }
        case Kind.ClearEOL: {
            store.emit('clear-eol');
            break;
        }
        case Kind.ClearAll: {
            store.emit('clear-all');
            store.cursor = {
                line: 0,
                col: 0,
            };
            store.emit('cursor');
            break;
        }
        case Kind.ScrollScreen: {
            store.emit('screen-scrolled', action.cols);
            break;
        }
        case Kind.SetScrollRegion: {
            store.scroll_region = action.region;
            log.debug('Region is set: ', store.scroll_region);
            store.emit('scroll-region-updated');
            break;
        }
        case Kind.Resize: {
            if (store.size.lines === action.lines
                && store.size.cols === action.cols) {
                break;
            }
            store.size.lines = action.lines;
            store.size.cols = action.cols;
            store.emit('resize');
            break;
        }
        case Kind.UpdateFG: {
            store.fg_color = colorString(action.color, store.font_attr.fg);
            store.emit('update-fg');
            log.debug('Foreground color is updated: ' + store.fg_color);
            break;
        }
        case Kind.UpdateBG: {
            store.bg_color = colorString(action.color, store.font_attr.bg);
            store.emit('update-bg');
            log.debug('Background color is updated: ' + store.bg_color);
            break;
        }
        case Kind.Mode: {
            store.mode = action.mode;
            store.emit('mode', store.mode);
            break;
        }
        case Kind.BusyStart: {
            store.busy = true;
            store.emit('busy');
            break;
        }
        case Kind.BusyStop: {
            store.busy = false;
            store.emit('busy');
            break;
        }
        case Kind.UpdateFontSize: {
            store.font_attr.width = action.width;
            store.font_attr.height = action.height;
            log.debug(`Actual font size is updated: ${action.width}:${action.height}`);
            store.emit('font-size-changed');
            break;
        }
        case Kind.UpdateFontPx: {
            store.font_attr.specified_px = action.font_px;
            store.emit('font-px-specified');
            break;
        }
        case Kind.UpdateFontFace: {
            store.font_attr.face = action.font_face;
            store.emit('font-face-specified');
            break;
        }
        case Kind.UpdateScreenSize: {
            if (store.size.width === action.width
                && store.size.height === action.height) {
                break;
            }
            store.size.width = action.width;
            store.size.height = action.height;
            store.emit('update-screen-size');
            log.debug(`Screen size is updated: (${action.width}px, ${action.height}px)`);
            break;
        }
        case Kind.UpdateScreenBounds: {
            if (store.size.lines === action.lines
                && store.size.cols === action.cols) {
                break;
            }
            store.size.lines = action.lines;
            store.size.cols = action.cols;
            store.scroll_region = {
                top: 0,
                left: 0,
                right: action.cols - 1,
                bottom: action.lines - 1,
            };
            store.emit('update-screen-bounds');
            log.debug(`Screen bounds are updated: (${action.lines} lines, ${action.cols} cols)`);
            break;
        }
        case Kind.EnableMouse: {
            if (!store.mouse_enabled) {
                store.mouse_enabled = true;
                store.emit('mouse-enabled');
                log.info('Mouse enabled.');
            }
            break;
        }
        case Kind.DisableMouse: {
            if (store.mouse_enabled) {
                store.mouse_enabled = false;
                store.emit('mouse-disabled');
                log.info('Mouse disabled.');
            }
            break;
        }
        case Kind.DragStart: {
            if (store.mouse_enabled) {
                store.dragging = new ScreenDrag();
                store.emit('input', store.dragging.start(action.event));
                store.emit('drag-started');
            } else {
                log.debug('Click ignored because mouse is disabled.');
            }
            break;
        }
        case Kind.DragUpdate: {
            if (store.mouse_enabled && store.dragging !== null) {
                const input = store.dragging.drag(action.event);
                if (input) {
                    store.emit('input', input);
                    store.emit('drag-updated');
                }
            }
            break;
        }
        case Kind.DragEnd: {
            if (store.mouse_enabled && store.dragging !== null) {
                store.emit('input', store.dragging.end(action.event));
                store.emit('drag-ended');
                store.dragging = null;
            }
            break;
        }
        case Kind.Bell: {
            store.emit(action.visual ? 'visual-bell' : 'beep');
            break;
        }
        case Kind.SetTitle: {
            store.title = action.title;
            store.emit('title-changed');
            log.info(`Title is set to '${store.title}'`);
            break;
        }
        case Kind.SetIcon: {
            store.icon_path = action.icon_path;
            store.emit('icon-changed');
            log.info(`Icon is set to '${store.icon_path}'`);
            break;
        }
        case Kind.WheelScroll: {
            if (store.mouse_enabled) {
                const input = store.wheel_scrolling.handleEvent(action.event as WheelEvent);
                if (input) {
                    store.emit('input', input);
                    store.emit('wheel-scrolled');
                }
            }
            break;
        }
        default: {
            log.warn('Unhandled action: ', action);
            break;
        }
    }
});
