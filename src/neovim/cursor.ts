import NeovimStore from './store';
import log from '../log';
import {dragEnd} from './actions';

export default class NeovimCursor {
    element: HTMLDivElement;
    pixel_ratio: number;

    constructor(private store: NeovimStore) {
        this.pixel_ratio = window.devicePixelRatio || 1;
        this.element = document.querySelector('.neovim-cursor') as HTMLDivElement;
        this.element.style.borderColor = 'white';
        this.element.style.top = '0px';
        this.element.style.left = '0px';
        this.updateSize();

        this.element.addEventListener('mouseup', (e: MouseEvent) => {
            this.store.dispatcher.dispatch(dragEnd(e));
        });

        this.store.on('cursor', this.updateCursorPos.bind(this));
        this.store.on('mode', this.onModeChanged.bind(this));
        this.store.on('update-fg', this.updateColor.bind(this));
        this.store.on('font-size-changed', this.updateSize.bind(this));
    }

    updateSize() {
        this.element.style.width = (this.store.font_attr.width / this.pixel_ratio) + 'px';
        this.element.style.height = (this.store.font_attr.height / this.pixel_ratio) + 'px';
    }

    updateColor() {
        log.info('changed cursor color: ', this.store.fg_color);
        this.element.style.borderColor = this.store.fg_color;
    }

    onModeChanged() {
        switch (this.store.mode) {
            case 'insert':
                this.element.style.width = '1px';
                break;
            case 'normal':
                this.element.style.width = (this.store.font_attr.width) + 'px';
                break;
            default:
                break;
        }
    }

    updateCursorPos() {
        const {line, col} = this.store.cursor;
        const {width, height} = this.store.font_attr;

        const x = col * width / this.pixel_ratio;
        const y = line * height / this.pixel_ratio;

        this.element.style.left = x + 'px';
        this.element.style.top = y + 'px';

        log.debug(`Cursor is moved to (${x}, ${y})`);
    }
}
