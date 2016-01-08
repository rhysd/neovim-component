import NeovimStore from './store';
import {inputToNeovim, notifyFocusChanged} from './actions';
import log from '../log';

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

    static getVimSpecialChar(code: number, shift: boolean) {
        switch (code) {
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

    constructor(private store: NeovimStore) {
        this.ime_running = false;

        this.element = document.querySelector('.neovim-input') as HTMLInputElement;
        this.element.addEventListener('compositionstart', this.startComposition.bind(this));
        this.element.addEventListener('compositionend', this.endComposition.bind(this));
        this.element.addEventListener('keydown', this.onInsertControlChar.bind(this));
        this.element.addEventListener('input', this.onInsertNormalChar.bind(this));
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
    }

    onBlur(e: Event) {
        e.preventDefault();
        this.store.dispatcher.dispatch(notifyFocusChanged(false));
    }

    // Note:
    // Assumes keydown event is always fired before input event
    onInsertControlChar(event: KeyboardEvent) {
        log.debug('Keydown event:', event);
        if (this.ime_running) {
            log.debug('IME is running.  Input canceled.');
            return;
        }

        const special_char = NeovimInput.getVimSpecialChar(event.keyCode, event.shiftKey);
        if (!special_char && NeovimInput.shouldIgnoreOnKeydown(event)) {
            return;
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
        vim_input += (special_char || String.fromCharCode(event.keyCode).toLowerCase()) + '>';
        this.inputToNeovim(vim_input, event);
    }

    inputToNeovim(input: string, event: Event) {
        this.store.dispatcher.dispatch(inputToNeovim(input));

        log.info('Input to neovim: ' + input);

        event.preventDefault();
        event.stopPropagation();
        const t = event.target as HTMLInputElement;
        t.value = '';
    }

    onInsertNormalChar(event: KeyboardEvent) {
        log.debug('Input event:', event);

        if (this.ime_running) {
            log.debug('IME is running.  Input canceled.');
            return;
        }

        const t = event.target as HTMLInputElement;
        if (t.value === '') {
            log.warn('onInsertNormalChar: Empty');
            return;
        }

        this.inputToNeovim(t.value, event);
    }
}
