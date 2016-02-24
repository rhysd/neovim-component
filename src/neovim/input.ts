import NeovimStore from './store';
import {inputToNeovim, notifyFocusChanged} from './actions';
import log from '../log';

const OnDarwin = global.process.platform === 'darwin';

export default class NeovimInput {
    element: HTMLInputElement;
    ime_running: boolean;      // XXX: Local state!

    static shouldIgnoreOnKeydown(event: KeyboardEvent) {
        const {ctrlKey, shiftKey, altKey, keyCode} = event;
        return !ctrlKey && !altKey ||
               shiftKey && keyCode === 16 ||
               ctrlKey && keyCode === 17 ||
               altKey && keyCode === 18;
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
                case '<':            return 'LT';
                case '\0':           return 'Nul';
                default:             return null;
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
            };
            case 'Tab': {
                if (ctrl && key_code === 73) {
                    // Note:
                    // When <C-i> is input (73 is key code of 'i')
                    return 'i';
                } else {
                    return 'Tab';
                }
            };
            case 'Enter': {  // Note: Should consider <NL>?
                if (ctrl && key_code === 77) {
                    // Note:
                    // When <C-m> is input (77 is key code of 'm')
                    return 'm';
                } else {
                    return 'CR';
                }
            };
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
        const special_char = event.key === undefined ?
                        NeovimInput.getVimSpecialCharFromKeyCode(event.keyCode, event.shiftKey) :
                        NeovimInput.getVimSpecialCharFromKey(event);
        if (!special_char) {
            return null;
        }

        let vim_input = '<';
        if (event.ctrlKey) {
            vim_input += 'C-';
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

    static getVimInputFromKeyCode(event: KeyboardEvent) {
        let vim_input = '<';
        if (event.ctrlKey) {
            vim_input += 'C-';
        }
        if (event.altKey) {
            vim_input += 'A-';
        }
        // Note: <LT> is a special case where shift should not be handled.
        if (event.shiftKey) {
            vim_input += 'S-';
        }
        vim_input += String.fromCharCode(event.keyCode).toLowerCase() + '>';
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

        this.focus();
    }

    startComposition(event: Event) {
        log.debug('start composition');
        this.ime_running = true;
    }

    endComposition(event: Event) {
        log.debug('end composition');
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

        if (event.altKey && OnDarwin && this.store.mode === 'normal') {
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
                let input = event.key;
                if (event.altKey) {
                    // Note:
                    // KeyboardEvent.key considers Ctrl key and Shift key because
                    // they're reflected to key code value.  But Alt key is not considered.
                    // So we should care.
                    input = `<A-${input}>`;
                }
                this.inputToNeovim(input, event);
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
        t.value = '';
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

        let input = t.value.replace(/</g, "<LT>");
        this.inputToNeovim(input, event);
    }
}
