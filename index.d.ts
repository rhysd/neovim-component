import { EventEmitter } from 'events';
import { Nvim } from 'promised-neovim-client';
import { Dispatcher } from 'flux';
import cp = require('child_process');
import NvimClient = require('promised-neovim-client');
export declare type RPCValue = NvimClient.Buffer | NvimClient.Window | NvimClient.Tabpage | number | boolean | string | any[] | {
    [key: string]: any;
};

export interface HighlightSet {
    background?: number;
    bg?: string;
    bold?: boolean;
    fg?: string;
    foreground?: number;
    italic?: boolean;
    reverse?: boolean;
    undercurl?: boolean;
    underline?: boolean;
}
export interface Region {
    top: number;
    left: number;
    right: number;
    bottom: number;
}
export declare enum Kind {
    Bell = 0,
    BusyStart = 1,
    BusyStop = 2,
    ClearAll = 3,
    ClearEOL = 4,
    Cursor = 5,
    DisableMouse = 6,
    DragEnd = 7,
    DragStart = 8,
    DragUpdate = 9,
    EnableMouse = 10,
    Highlight = 11,
    Input = 12,
    Mode = 13,
    PutText = 14,
    Resize = 15,
    ScrollScreen = 16,
    SetIcon = 17,
    SetScrollRegion = 18,
    SetTitle = 19,
    UpdateBG = 20,
    UpdateFG = 21,
    UpdateFontFace = 22,
    UpdateFontPx = 23,
    UpdateFontSize = 24,
    UpdateScreenBounds = 25,
    UpdateScreenSize = 26,
    WheelScroll = 27,
    FocusChanged = 28,
}
export interface ActionType {
    type: Kind;
    col?: number;
    color?: number;
    cols?: number;
    draw_width?: number;
    draw_height?: number;
    event?: MouseEvent | WheelEvent;
    focused?: boolean;
    font_face?: string;
    font_px?: number;
    height?: number;
    highlight?: HighlightSet;
    icon_path?: string;
    input?: string;
    line?: number;
    lines?: number;
    mode?: string;
    region?: Region;
    text?: string[][];
    title?: string;
    visual?: boolean;
    width?: number;
}
export declare function putText(text: string[][]): {
    type: Kind;
    text: string[][];
};
export declare function cursor(line: number, col: number): {
    type: Kind;
    line: number;
    col: number;
};
export declare function highlight(highlight: HighlightSet): {
    type: Kind;
    highlight: HighlightSet;
};
export declare function clearAll(): {
    type: Kind;
};
export declare function clearEndOfLine(): {
    type: Kind;
};
export declare function resize(lines: number, cols: number): {
    type: Kind;
    lines: number;
    cols: number;
};
export declare function updateForeground(color: number): {
    type: Kind;
    color: number;
};
export declare function updateBackground(color: number): {
    type: Kind;
    color: number;
};
export declare function changeMode(mode: string): {
    type: Kind;
    mode: string;
};
export declare function startBusy(): {
    type: Kind;
};
export declare function stopBusy(): {
    type: Kind;
};
export declare function updateFontSize(draw_width: number, draw_height: number, width: number, height: number): {
    type: Kind;
    draw_width: number;
    draw_height: number;
    width: number;
    height: number;
};
export declare function inputToNeovim(input: string): {
    type: Kind;
    input: string;
};
export declare function updateFontPx(font_px: number): {
    type: Kind;
    font_px: number;
};
export declare function updateFontFace(font_face: string): {
    type: Kind;
    font_face: string;
};
export declare function updateScreenSize(width: number, height: number): {
    type: Kind;
    width: number;
    height: number;
};
export declare function updateScreenBounds(lines: number, cols: number): {
    type: Kind;
    lines: number;
    cols: number;
};
export declare function enableMouse(): {
    type: Kind;
};
export declare function disableMouse(): {
    type: Kind;
};
export declare function dragStart(event: MouseEvent): {
    type: Kind;
    event: MouseEvent;
};
export declare function dragUpdate(event: MouseEvent): {
    type: Kind;
    event: MouseEvent;
};
export declare function dragEnd(event: MouseEvent): {
    type: Kind;
    event: MouseEvent;
};
export declare function bell(visual: boolean): {
    type: Kind;
    visual: boolean;
};
export declare function setTitle(title: string): {
    type: Kind;
    title: string;
};
export declare function setIcon(icon_path: string): {
    type: Kind;
    icon_path: string;
};
export declare function wheelScroll(event: WheelEvent): {
    type: Kind;
    event: WheelEvent;
};
export declare function scrollScreen(cols: number): {
    type: Kind;
    cols: number;
};
export declare function setScrollRegion(region: Region): {
    type: Kind;
    region: Region;
};
export declare function notifyFocusChanged(focused: boolean): {
    type: Kind;
    focused: boolean;
};

export class NeovimCursor {
    element: HTMLDivElement;
    constructor(store: NeovimStore);
    updateSize(): void;
    updateColor(): void;
    onModeChanged(): void;
    updateCursorPos(): void;
}

export class NeovimInput {
    element: HTMLInputElement;
    ime_running: boolean;
    static shouldHandleModifier(event: KeyboardEvent): boolean;
    static getVimSpecialChar(code: number, shift: boolean): string;
    constructor(store: NeovimStore);
    startComposition(event: Event): void;
    endComposition(event: Event): void;
    focus(): void;
    onInsertControlChar(event: KeyboardEvent): void;
    inputToNeovim(input: string, event: Event): void;
    onInsertNormalChar(event: KeyboardEvent): void;
}

export class NeovimProcess {
    command: string;
    argv: string[];
    neovim_process: cp.ChildProcess;
    client: NvimClient.Nvim;
    started: boolean;
    constructor(store: NeovimStore, command: string, argv: string[]);
    attach(lines: number, columns: number): Promise<void>;
    onRequested(method: string, args: RPCValue[], response: RPCValue): void;
    onNotified(method: string, args: RPCValue[]): void;
    onDisconnected(): void;
    finalize(): void;
}

export class ScreenDrag {
    line: number;
    col: number;
    static buildInputOf(e: MouseEvent, type: string, line: number, col: number): string;
    constructor(store: NeovimStore);
    start(down_event: MouseEvent): string;
    drag(move_event: MouseEvent): string;
    end(up_event: MouseEvent): string;
}

export class ScreenWheel {
    x: number;
    y: number;
    shift: boolean;
    ctrl: boolean;
    constructor(store: NeovimStore);
    handleEvent(e: WheelEvent): string;
}

export class NeovimScreen {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    cursor: NeovimCursor;
    input: NeovimInput;
    constructor(store: NeovimStore, canvas: HTMLCanvasElement);
    wheel(e: WheelEvent): void;
    mouseDown(e: MouseEvent): void;
    mouseUp(e: MouseEvent): void;
    mouseMove(e: MouseEvent): void;
    resizeWithPixels(width_px: number, height_px: number): void;
    resize(lines: number, cols: number): void;
    changeFontSize(specified_px: number): void;
    scroll(cols_delta: number): void;
    focus(): void;
    clearAll(): void;
    clearEol(): void;
    convertPositionToLocation(line: number, col: number): {
        x: number;
        y: number;
    };
    convertLocationToPosition(x: number, y: number): {
        line: number;
        col: number;
    };
    checkShouldResize(): void;
}

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
    underline: boolean;
    undercurl: boolean;
    draw_width: number;
    draw_height: number;
    width: number;
    height: number;
    face: string;
    specified_px: number;
}
export declare type DispatcherType = Dispatcher<ActionType>;
export class NeovimStore extends EventEmitter {
    dispatch_token: string;
    size: Size;
    focused: boolean;
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
    dispatcher: Dispatcher<ActionType>;
}

export class Neovim extends EventEmitter {
    process: NeovimProcess;
    screen: NeovimScreen;
    store: NeovimStore;
    constructor(command: string, argv: string[], font: string, font_size: number);
    attachCanvas(width: number, height: number, canvas: HTMLCanvasElement): void;
    quit(): void;
    getClient(): Nvim;
    focus(): void;
    setArgv(argv: string[]): Promise<void>;
}

export class NeovimElement extends HTMLElement {
    editor: Neovim;
    width: number;
    height: number;
    fontSize: number;
    font: string;
    nvimCmd: string;
    argv: string[];
    onProcessAttached: () => void;
    onQuit: () => void;
}
