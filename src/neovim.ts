import {EventEmitter} from 'events';
import Process from './neovim/process';
import Screen from './neovim/screen';
import Store, {NeovimStore as StoreType} from './neovim/store';
import {updateFontPx, updateFontFace, resize, resizePixels} from './neovim/actions';
import Cursor from './neovim/cursor';
import Input from './neovim/input';
import Dispatcher from './neovim/dispatcher';

export default class Neovim extends EventEmitter {
    process: Process;
    screen: Screen;
    store: StoreType;
    cursor: Cursor;
    input: Input;

    constructor(
            command: string,
            argv: string[],
            font: string,
            font_size: number,
            width: number,
            height: number
    ) {
        super();

        this.store = Store;

        // Note:
        // Perhaps store should not be singlton because:
        //  1. Store can't be initialized by <neovim-editor> props.
        //  2. Multiple <neovim-editor> component can't exist.
        Dispatcher.dispatch(updateFontFace(font));
        Dispatcher.dispatch(updateFontPx(font_size));
        Dispatcher.dispatch(resizePixels(width, height));

        this.process = new Process(command, argv);
    }

    attachDOM(canvas: HTMLCanvasElement) {
        this.screen = new Screen(canvas);
        this.process
            .attach(Store.screen_size.lines, Store.screen_size.cols)
            .then(() => {
                this.process.client.on('disconnect', () => this.emit('quit'));
                this.emit('process-attached');
            });
        this.cursor = new Cursor();
        this.input = new Input();
    }

    quit() {
        this.process.finalize();
    }

    getClient() {
        return this.process.client;
    }

    focus() {
        this.screen.focus();
    }

    resizePixels(width_px: number, height_px: number) {
        Dispatcher.dispatch(resizePixels(width_px, height_px));
    }

    resize(lines: number, cols: number) {
        Dispatcher.dispatch(resize(lines, cols));
    }
}
