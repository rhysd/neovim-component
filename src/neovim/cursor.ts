import Store from './store';

export default class NeovimCursor {
    element: HTMLDivElement;

    constructor() {
        this.element = document.querySelector('.neovim-cursor') as HTMLDivElement;
        this.element.style.borderColor = 'white';
        this.element.style.top = '0px';
        this.element.style.left = '0px';
        this.element.style.width = Store.font_attr.width + 'px';
        this.element.style.height = Store.font_attr.height + 'px';

        Store.on('cursor', this.updateCursorPos.bind(this));
        Store.on('mode', this.onModeChanged.bind(this));
        Store.on('update-fg', this.changeColor.bind(this));
    }

    changeColor() {
        console.log('changed cursor color: ', Store.fg_color);
        this.element.style.borderColor = Store.fg_color;
    }

    onModeChanged() {
        switch(Store.mode) {
            case 'insert':
                this.element.style.width = '1px';
                break;
            case 'normal':
                this.element.style.width = Store.font_attr.width + 'px';
                break;
            default:
                break;
        }
    }

    updateCursorPos() {
        const {line, col} = Store.cursor;
        const {width, height} = Store.font_attr;

        const x = col * width;
        const y = line * height;

        this.element.style.left = x + 'px';
        this.element.style.top = y + 'px';

        console.log(`Cursor is moved to (${x}, ${y})`);
    }
}
