export interface HighlightSet {
    background?: number;
    bg?: string;
    bold?: boolean;
    fg?: string;
    foreground?: number;
    italic?: boolean;
    reverse?: boolean;
    special?: number;
    undercurl?: boolean;
    underline?: boolean;
}

export interface Region {
    top: number;
    left: number;
    right: number;
    bottom: number;
}

export enum Kind {
    Bell,
    BusyStart,
    BusyStop,
    ChangeCursorDrawDelay,
    ClearAll,
    ClearEOL,
    Cursor,
    DisableMouse,
    DisableAltKey,
    DisableMetaKey,
    DragEnd,
    DragStart,
    DragUpdate,
    EnableMouse,
    Highlight,
    Input,
    Mode,
    PutText,
    Resize,
    ScrollScreen,
    SetIcon,
    SetScrollRegion,
    SetTitle,
    StartBlinkCursor,
    StopBlinkCursor,
    UpdateBG,
    UpdateFG,
    UpdateSP,
    UpdateFontFace,
    UpdateFontPx,
    UpdateFontSize,
    UpdateLineHeight,
    UpdateScreenBounds,
    UpdateScreenSize,
    WheelScroll,
    FocusChanged,
}

export interface ActionType {
    type: Kind;
    col?: number;
    color?: number;
    cols?: number;
    delay?: number;
    disabled?: boolean;
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
    line_height?: number;
    lines?: number;
    mode?: string;
    region?: Region;
    text?: string[][];
    title?: string;
    visual?: boolean;
    width?: number;
}

export function putText(text: string[][]) {
    return {
        type: Kind.PutText,
        text,
    };
}

export function cursor(line: number, col: number) {
    return {
        type: Kind.Cursor,
        line, col,
    };
}

export function highlight(highlight: HighlightSet) {
    return {
        type: Kind.Highlight,
        highlight,
    };
}

export function clearAll() {
    return {
        type: Kind.ClearAll,
    };
}

export function clearEndOfLine() {
    return {
        type: Kind.ClearEOL,
    };
}

export function resize(lines: number, cols: number) {
    return {
        type: Kind.Resize,
        lines, cols,
    };
}

export function updateForeground(color: number) {
    return {
        type: Kind.UpdateFG,
        color,
    };
}

export function updateBackground(color: number) {
    return {
        type: Kind.UpdateBG,
        color,
    };
}

export function updateSpecialColor(color: number) {
    return {
        type: Kind.UpdateSP,
        color,
    };
}

export function changeMode(mode: string) {
    return {
        type: Kind.Mode,
        mode,
    };
}

export function startBusy() {
    return {
        type: Kind.BusyStart,
    };
}

export function stopBusy() {
    return {
        type: Kind.BusyStop,
    };
}

export function updateFontSize(draw_width: number, draw_height: number, width: number, height: number) {
    return {
        type: Kind.UpdateFontSize,
        draw_width, draw_height,
        width, height,
    };
}

export function inputToNeovim(input: string) {
    return {
        type: Kind.Input,
        input,
    };
}

export function updateFontPx(font_px: number) {
    return {
        type: Kind.UpdateFontPx,
        font_px,
    };
}

export function updateFontFace(font_face: string) {
    return {
        type: Kind.UpdateFontFace,
        font_face,
    };
}

export function updateScreenSize(width: number, height: number) {
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
    return {
        type: Kind.UpdateScreenBounds,
        lines, cols,
    };
}

export function enableMouse() {
    return {
        type: Kind.EnableMouse,
    };
}

export function disableMouse() {
    return {
        type: Kind.DisableMouse,
    };
}

export function dragStart(event: MouseEvent) {
    return {
        type: Kind.DragStart,
        event,
    };
}

export function dragUpdate(event: MouseEvent) {
    return {
        type: Kind.DragUpdate,
        event,
    };
}

export function dragEnd(event: MouseEvent) {
    return {
        type: Kind.DragEnd,
        event,
    };
}

export function bell(visual: boolean) {
    return {
        type: Kind.Bell,
        visual,
    };
}

export function setTitle(title: string) {
    return {
        type: Kind.SetTitle,
        title,
    };
}

export function setIcon(icon_path: string) {
    return {
        type: Kind.SetIcon,
        icon_path,
    };
}

export function wheelScroll(event: WheelEvent) {
    return {
        type: Kind.WheelScroll,
        event,
    };
}

export function scrollScreen(cols: number) {
    return {
        type: Kind.ScrollScreen,
        cols,
    };
}

export function setScrollRegion(region: Region) {
    return {
        type: Kind.SetScrollRegion,
        region,
    };
}

export function notifyFocusChanged(focused: boolean) {
    return {
        type: Kind.FocusChanged,
        focused,
    };
}

export function updateLineHeight(line_height: number) {
    return {
        type: Kind.UpdateLineHeight,
        line_height,
    };
}

export function disableAltKey(disabled: boolean) {
    return {
        type: Kind.DisableAltKey,
        disabled,
    };
}

export function disableMetaKey(disabled: boolean) {
    return {
        type: Kind.DisableMetaKey,
        disabled,
    };
}

export function changeCursorDrawDelay(delay: number) {
    return {
        type: Kind.ChangeCursorDrawDelay,
        delay,
    };
}

export function startBlinkCursor() {
    return {
        type: Kind.StartBlinkCursor,
    };
}
export function stopBlinkCursor() {
    return {
        type: Kind.StopBlinkCursor,
    };
}
