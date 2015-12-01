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

export enum Kind {
    BusyStart,
    BusyStop,
    ClearAll,
    ClearEOL,
    Cursor,
    DisableMouse,
    DragEnd,
    DragStart,
    DragUpdate,
    EnableMouse,
    Focus,
    Highlight,
    Input,
    Mode,
    PutText,
    Resize,
    UpdateBG,
    UpdateFG,
    UpdateFontFace,
    UpdateFontPx,
    UpdateFontSize,
    UpdateScreenBounds,
    UpdateScreenSize,
};

export interface ActionType {
    type: Kind;
    col?: number;
    color?: number;
    cols?: number;
    event?: MouseEvent;
    font_face?: string;
    font_px?: number;
    height?: number;
    highlight?: HighlightSet;
    input?: string;
    line?: number;
    lines?: number;
    mode?: string;
    text?: string[][];
    width?: number;
}

export function putText(text: string[][]) {
    'use strict';
    return {
        type: Kind.PutText,
        text,
    };
}

export function cursor(line: number, col: number) {
    'use strict';
    return {
        type: Kind.Cursor,
        line, col,
    };
}

export function highlight(highlight: HighlightSet) {
    'use strict';
    return {
        type: Kind.Highlight,
        highlight,
    };
}

export function clearAll() {
    'use strict';
    return {
        type: Kind.ClearAll
    };
}

export function clearEndOfLine() {
    'use strict';
    return {
        type: Kind.ClearEOL
    };
}

export function resize(lines: number, cols: number) {
    'use strict';
    return {
        type: Kind.Resize,
        lines, cols,
    };
}

export function updateForeground(color: number) {
    'use strict';
    return {
        type: Kind.UpdateFG,
        color,
    };
}

export function updateBackground(color: number) {
    'use strict';
    return {
        type: Kind.UpdateBG,
        color,
    };
}

export function changeMode(mode: string) {
    'use strict';
    return {
        type: Kind.Mode,
        mode,
    };
}

export function startBusy() {
    'use strict';
    return {
        type: Kind.BusyStart
    };
}

export function stopBusy() {
    'use strict';
    return {
        type: Kind.BusyStop
    };
}

export function updateFontSize(width: number, height: number) {
    'use strict';
    return {
        type: Kind.UpdateFontSize,
        width, height,
    };
}

export function inputToNeovim(input: string) {
    'use strict';
    return {
        type: Kind.Input,
        input,
    };
}

export function focus() {
    'use strict';
    return {
        type: Kind.Focus
    };
}

export function updateFontPx(font_px: number) {
    'use strict';
    return {
        type: Kind.UpdateFontPx,
        font_px,
    };
}

export function updateFontFace(font_face: string) {
    'use strict';
    return {
        type: Kind.UpdateFontFace,
        font_face,
    };
}

export function updateScreenSize(width: number, height: number) {
    'use strict';
    return {
        type: Kind.UpdateScreenSize,
        width, height,
    };
}

// Note:
// This function has the same effect as resize() but resize() is used
// for neovim's UI event and this function is used to change screen bounds
// via NeovimScreen's API.
export function updateScreenBounds(lines: number, cols: number) {
    'use strict';
    return {
        type: Kind.UpdateScreenBounds,
        lines, cols,
    };
}

export function enableMouse() {
    'use strict';
    return {
        type: Kind.EnableMouse
    };
}

export function disableMouse() {
    'use strict';
    return {
        type: Kind.DisableMouse
    };
}

export function dragStart(event: MouseEvent) {
    'use strict';
    return {
        type: Kind.DragStart,
        event,
    };
}

export function dragUpdate(event: MouseEvent) {
    'use strict';
    return {
        type: Kind.DragUpdate,
        event,
    };
}

export function dragEnd(event: MouseEvent) {
    'use strict';
    return {
        type: Kind.DragEnd,
        event,
    };
}
