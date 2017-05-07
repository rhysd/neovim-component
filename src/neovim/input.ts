import NeovimStore from './store';
import {inputToNeovim, notifyFocusChanged} from './actions';
import log from '../log';

const OnDarwin = global.process.platform === 'darwin';
const IsAlpha = /^[a-zA-Z]$/;

export default class NeovimInput {
    element: HTMLInputElement;
    ime_running: boolean;      // XXX: Local state!

    static shouldIgnoreOnKeydown(event: KeyboardEvent) {
        const {ctrlKey, shiftKey, altKey, keyCode, metaKey} = event;
        return !ctrlKey && !altKey && !metaKey ||
               shiftKey && keyCode === 16 ||
               ctrlKey && keyCode === 17 ||
               altKey && keyCode === 18 ||
               metaKey && keyCode === 91;
    }

    // Note:
    // Workaround when KeyboardEvent.key is not available.
    static getVimSpecialCharFromKeyCode(key_code: number, shift: boolean) {
        switch (key_code) {
            case 0:   return 'Nul';
            case 8:   return 'BS';
            case 9:   return 'Tab';
            case 10:  return 'NL';
            case 13:  return 'CR';
            case 33:  return 'PageUp';
            case 34:  return 'PageDown';
            case 27:  return 'Esc';
            case 32:  return 'Space';
            case 35:  return 'End';
            case 36:  return 'Home';
            case 37:  return 'Left';
            case 38:  return 'Up';
            case 39:  return 'Right';
            case 40:  return 'Down';
            case 45:  return 'Insert';
            case 46:  return 'Del';
            case 47:  return 'Help';
            case 92:  return 'Bslash';
            case 112: return 'F1';
            case 113: return 'F2';
            case 114: return 'F3';
            case 115: return 'F4';
            case 116: return 'F5';
            case 117: return 'F6';
            case 118: return 'F7';
            case 119: return 'F8';
            case 120: return 'F9';
            case 121: return 'F10';
            case 122: return 'F11';
            case 123: return 'F12';
            case 124: return 'Bar'; // XXX
            case 127: return 'Del'; // XXX
            case 188: return shift ? 'LT' : null;
            default:  return null;
        }
    }

    // Note:
    // Special key handling using KeyboardEvent.key.  Thank you @romgrk for the idea.
    // https://www.w3.org/TR/DOM-Level-3-Events-key/
    static getVimSpecialCharFromKey(event: KeyboardEvent) {
        const key = event.key;

        if (key.length === 1) {
            switch (key) {
                case '<':  return event.ctrlKey || event.altKey ? 'LT' : null;
                case ' ':  return 'Space';
                case '\0': return 'Nul';
                default:   return null;
            }
        }

        if (key[0] === 'F') {
            // F1, F2, F3, ...
            return /^F\d+/.test(key) ? key : null;
        }

        const ctrl = event.ctrlKey;
        const key_code = event.keyCode;

        switch (key) {
            case 'Escape': {
                if (ctrl && key_code !== 27) {
                    // Note:
                    // When <C-[> is input
                    // XXX:
                    // Keycode of '[' is not available because it is 219 in OS X
                    // and it is not for '['.
                    return '[';
                } else {
                    return 'Esc';
                }
            }
            case 'Backspace': {
                if (ctrl && key_code === 72) {
                    // Note:
                    // When <C-h> is input (72 is key code of 'h')
                    return 'h';
                } else {
                    return 'BS';
                }
            }
            case 'Tab': {
                if (ctrl && key_code === 73) {
                    // Note:
                    // When <C-i> is input (73 is key code of 'i')
                    return 'i';
                } else {
                    return 'Tab';
                }
            }
            case 'Enter': {  // Note: Should consider <NL>?
                if (ctrl && key_code === 77) {
                    // Note:
                    // When <C-m> is input (77 is key code of 'm')
                    return 'm';
                } else if (ctrl && key_code === 67) {
                    // XXX:
                    // This is workaround for a bug of Chromium.  Ctrl+c emits wrong KeyboardEvent.key.
                    // (It should be "\uxxxx" but actually "Enter")
                    // https://github.com/rhysd/NyaoVim/issues/37
                    return 'c';
                } else {
                    return 'CR';
                }
            }
            case 'PageUp':       return 'PageUp';
            case 'PageDown':     return 'PageDown';
            case 'End':          return 'End';
            case 'Home':         return 'Home';
            case 'ArrowLeft':    return 'Left';
            case 'ArrowUp':      return 'Up';
            case 'ArrowRight':   return 'Right';
            case 'ArrowDown':    return 'Down';
            case 'Insert':       return 'Insert';
            case 'Delete':       return 'Del';
            case 'Help':         return 'Help';
            case 'Unidentified': return null;
            default:             return null;
        }
    }

    static getVimSpecialCharInput(event: KeyboardEvent) {
        const should_fallback =
            (event.key === undefined) ||
            (event.key === '\0' && event.keyCode !== 0);
        const special_char = should_fallback ?
                        NeovimInput.getVimSpecialCharFromKeyCode(event.keyCode, event.shiftKey) :
                        NeovimInput.getVimSpecialCharFromKey(event);
        if (!special_char) {
            return null;
        }

        let vim_input = '<';
        if (event.ctrlKey) {
            vim_input += 'C-';
        }
        if (event.metaKey) {
            vim_input += 'D-';
        }
        if (event.altKey) {
            vim_input += 'A-';
        }
        // Note: <LT> is a special case where shift should not be handled.
        if (event.shiftKey && special_char !== 'LT') {
            vim_input += 'S-';
        }
        vim_input += special_char + '>';
        return vim_input;
    }

    static replaceKeyToAvoidCtrlShiftSpecial(ctrl: boolean, shift: boolean, key: string) {
        if (!ctrl || shift) {
            return key;
        }

        // Note:
        // These characters are especially replaced in Vim frontend.
        //     https://github.com/vim/vim/blob/d58b0f982ad758c59abe47627216a15497e9c3c1/src/gui_w32.c#L1956-L1989
        // Issue:
        //     https://github.com/rhysd/NyaoVim/issues/87
        switch (key) {
            case '6': return '^';
            case '-': return '_';
            case '2': return '@';
            default:  return key;
        }
    }

    static getVimInputFromKeyCode(event: KeyboardEvent) {
        let modifiers = '';
        if (event.ctrlKey) {
            modifiers += 'C-';
        }
        if (event.metaKey) {
            modifiers += 'D-';
        }
        if (event.altKey) {
            modifiers += 'A-';
        }
        // Note: <LT> is a special case where shift should not be handled.
        if (event.shiftKey) {
            modifiers += 'S-';
        }
        let vim_input =
            NeovimInput.replaceKeyToAvoidCtrlShiftSpecial(
                event.ctrlKey,
                event.shiftKey,
                String.fromCharCode(event.keyCode).toLowerCase(),
            );
        if (modifiers !== '') {
            vim_input = `<${modifiers}${vim_input}>`;
        }
        return vim_input;
    }

    constructor(private store: NeovimStore) {
        this.ime_running = false;

        this.element = document.querySelector('.neovim-input') as HTMLInputElement;
        this.element.addEventListener('compositionstart', this.startComposition.bind(this));
        this.element.addEventListener('compositionend', this.endComposition.bind(this));
        this.element.addEventListener('keydown', this.onInputNonText.bind(this));
        this.element.addEventListener('input', this.onInputText.bind(this));
        this.element.addEventListener('blur', this.onBlur.bind(this));
        this.element.addEventListener('focus', this.onFocus.bind(this));
        this.store.on('cursor', this.updateElementPos.bind(this));

        this.focus();
    }

    startComposition(_: Event) {
        log.debug('start composition');
        this.ime_running = true;
    }

    endComposition(event: CompositionEvent) {
        log.debug('end composition');
        this.inputToNeovim(event.data, event);
        this.ime_running = false;
    }

    focus() {
        this.element.focus();
    }

    onFocus() {
        this.store.dispatcher.dispatch(notifyFocusChanged(true));

        // Note:
        // Neovim frontend has responsiblity to emit 'FocusGained'.
        // :execute 'normal!' "\<FocusGained>" is available.
        // (it seems undocumented.)
        this.store.dispatcher.dispatch(inputToNeovim('<FocusGained>'));
    }

    onBlur(e: Event) {
        e.preventDefault();
        this.store.dispatcher.dispatch(notifyFocusChanged(false));

        // Note:
        // Neovim frontend has responsiblity to emit 'FocusLost'.
        // :execute 'normal!' "\<FocusLost>" is available.
        // (it seems undocumented.)
        this.store.dispatcher.dispatch(inputToNeovim('<FocusLost>'));
    }

    // Note:
    // Assumes keydown event is always fired before input event
    onInputNonText(event: KeyboardEvent) {
        log.debug('Keydown event:', event);
        if (this.ime_running) {
            log.debug('IME is running.  Input canceled.');
            return;
        }

        const special_sequence = NeovimInput.getVimSpecialCharInput(event);
        if (special_sequence) {
            this.inputToNeovim(special_sequence, event);
            return;
        }

        if (NeovimInput.shouldIgnoreOnKeydown(event)) {
            return;
        }

        const should_osx_workaround = OnDarwin && event.altKey && !event.ctrlKey && this.store.mode === 'normal';
        if (this.store.alt_key_disabled && event.altKey) {
            // Note: Overwrite 'altKey' to false to disable alt key input.
            Object.defineProperty(event, 'altKey', {value: false});
        }
        if (this.store.meta_key_disabled && event.metaKey) {
            // Note:
            // Simply ignore input with metakey if metakey is disabled.  This aims to delegate the key input
            // to menu items on OS X.
            return;
        }

        if (should_osx_workaround) {
            // Note:
            //
            // In OS X, option + {key} sequences input special characters which can't be
            // input with keyboard normally.  (e.g. option+a -> å)
            // MacVim accepts the special characters only in insert mode, otherwise <A-{char}>
            // is emitted.
            //
            this.inputToNeovim(NeovimInput.getVimInputFromKeyCode(event), event);
            return;
        }

        if (event.key) {
            if (event.key.length === 1) {
                let input = '<';
                if (event.ctrlKey) {
                    input += 'C-';
                }
                if (event.metaKey) {
                    input += 'D-';
                }
                if (event.altKey) {
                    input += 'A-';
                }
                if (event.shiftKey && IsAlpha.test(event.key)) {
                    // Note:
                    // If input is not an alphabetical character,  it already considers
                    // Shift modifier.
                    //  e.g. Ctrl+Shift+2 -> event.key == '@'
                    // But for alphabets, Vim ignores the case.  For example <C-s> is
                    // equivalent to <C-S>.  So we need to specify <C-S-s> or <C-S-S>.
                    input += 'S-';
                }
                if (input === '<') {
                    // Note: No modifier was pressed
                    this.inputToNeovim(event.key, event);
                } else {
                    const key = NeovimInput.replaceKeyToAvoidCtrlShiftSpecial(event.ctrlKey, event.shiftKey, event.key);
                    this.inputToNeovim(input + key + '>', event);
                }
            } else {
                log.warn("Invalid key input on 'keydown': ", event.key);
            }
        } else {
            this.inputToNeovim(NeovimInput.getVimInputFromKeyCode(event), event);
        }
    }

    inputToNeovim(input: string, event: Event) {
        this.store.dispatcher.dispatch(inputToNeovim(input));

        log.debug('Input to neovim:', JSON.stringify(input));

        event.preventDefault();
        event.stopPropagation();
        const t = event.target as HTMLInputElement;
        if (t.value) {
            t.value = '';
        }
    }

    onInputText(event: KeyboardEvent) {
        log.debug('Input event:', event);

        if (this.ime_running) {
            log.debug('IME is running.  Input canceled.');
            return;
        }

        const t = event.target as HTMLInputElement;
        if (t.value === '') {
            log.warn('onInputText: Empty');
            return;
        }

        const input = t.value !== '<' ? t.value : '<LT>';
        this.inputToNeovim(input, event);
    }

    updateElementPos() {
        const {line, col} = this.store.cursor;
        const {width, height} = this.store.font_attr;

        const x = col * width;
        const y = line * height;

        this.element.style.left = x + 'px';
        this.element.style.top = y + 'px';
    }
}
