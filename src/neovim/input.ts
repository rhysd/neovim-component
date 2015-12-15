import NeovimStore from './store';
import {inputToNeovim} from './actions';
import log from '../log';

export default class NeovimInput {
    element: HTMLInputElement;
    ime_running: boolean;

    static shouldHandleModifier(event: KeyboardEvent) {
        return event.ctrlKey && event.keyCode !== 17 ||
               event.altKey && event.keyCode !== 18;
    }

    static getVimSpecialChar(code: number, shift: boolean) {
        switch (code) {
            case 0:   return 'Nul';
            case 8:   return 'BS';
            case 9:   return 'Tab';
            case 10:  return 'NL';
            case 13:  return 'CR';
            case 27:  return 'Esc';
            case 32:  return 'Space';
            case 35:  return 'End';
            case 36:  return 'Home';
            case 37:  return 'Left';
            case 38:  return 'Up';
            case 39:  return 'Right';
            case 40:  return 'Down';
            case 46:  return 'Del';
            case 92:  return 'Bslash';
            case 124: return 'Bar';
            case 127: return 'Del';
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
        this.element.addEventListener('blur', e => e.preventDefault());

        this.store.on('focus', this.focus.bind(this));
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

    // Note:
    // Assumes keydown event is always fired before input event
    onInsertControlChar(event: KeyboardEvent) {
        log.debug('Keydown event:', event);
        if (this.ime_running) {
            log.debug('IME is running.  Input canceled.');
            return;
        }

        const special_char = NeovimInput.getVimSpecialChar(event.keyCode, event.shiftKey);
        if (!special_char && !NeovimInput.shouldHandleModifier(event)) {
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
