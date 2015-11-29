import Store from './store';
import Dispatcher from './dispatcher';
import {inputToNeovim} from './actions';
import log from '../log';

export default class NeovimInput {
    element: HTMLInputElement;
    ime_running: boolean;

    static shouldHandleModifier(event: KeyboardEvent) {
        return event.ctrlKey && event.keyCode !== 17 ||
               event.altKey && event.keyCode !== 18;
    }

    static getVimSpecialChar(code: number) {
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
            default:  return null;
        }
    }

    constructor() {
        this.ime_running = false;

        this.element = document.querySelector('.neovim-input') as HTMLInputElement;
        this.element.addEventListener('compositionstart', this.startComposition.bind(this));
        this.element.addEventListener('compositionend', this.endComposition.bind(this));
        this.element.addEventListener('keydown', this.onInsertControlChar.bind(this));
        this.element.addEventListener('input', this.onInsertNormalChar.bind(this));
        this.element.addEventListener('blur', e => e.preventDefault());

        Store.on('focus', this.focus.bind(this));
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
        if (this.ime_running) {
            return;
        }

        const special_char = NeovimInput.getVimSpecialChar(event.keyCode);
        if (!NeovimInput.shouldHandleModifier(event) && !special_char) {
            return;
        }

        let vim_input = '<';
        if (event.ctrlKey) {
            vim_input += 'C-';
        }
        if (event.altKey) {
            vim_input += 'A-';
        }
        vim_input += (special_char || String.fromCharCode(event.keyCode)) + '>';
        this.inputToNeovim(vim_input, event);
    }

    inputToNeovim(input: string, event: Event) {
        Dispatcher.dispatch(inputToNeovim(input));

        log.info('Input to neovim: ' + input);

        event.preventDefault();
        event.stopPropagation();
        const t = event.target as HTMLInputElement;
        t.value = '';
    }

    onInsertNormalChar(event: KeyboardEvent) {
        if (this.ime_running) {
            return;
        }

        const t = event.target as HTMLInputElement;
        if (t.value === '') {
            log.warn('onInsertNormalChar: Empty');
            return;
        }

        if (t.value === '<') {
            this.inputToNeovim('\\lt', event);
            return;
        }

        this.inputToNeovim(t.value, event);
    }
}
