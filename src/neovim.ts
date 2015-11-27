import {EventEmitter} from 'events';
import Process from './neovim/process';
import Screen from './neovim/screen';
import Store, {NeovimStore as StoreType} from './neovim/store';
import {updateFontPx, updateFontFace, updateScreenSize} from './neovim/actions';
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
        Dispatcher.dispatch(updateScreenSize(width, height));

        this.process = new Process(command, argv);
    }

    attachDOM(canvas: HTMLCanvasElement) {
        this.screen = new Screen(canvas);
        this.process
            .attach(Store.size.lines, Store.size.cols)
            .then(() => {
                this.process.client.on('disconnect', () => this.emit('quit'));
                this.emit('process-attached');
            });
        this.cursor = new Cursor();
        this.input = new Input();
    }

    changeFontSize(new_size: number) {
        this.screen.updateActualFontSize(new_size);
    }

    resizeScreen(width_px: number, height_px: number) {
        this.screen.resizeScreen(width_px, height_px);
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
}
