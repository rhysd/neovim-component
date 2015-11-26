import {EventEmitter} from 'events';
import Process from './neovim/process';
import Screen from './neovim/screen';
import Store, {NeovimStore as StoreType} from './neovim/store';
import {updateFontPx, updateFontFace} from './neovim/actions';
import Cursor from './neovim/cursor';
import Input from './neovim/input';
import Dispatcher from './neovim/dispatcher';

export default class Neovim extends EventEmitter {
    process: Process;
    screen: Screen;
    store: StoreType;
    cursor: Cursor;
    input: Input;

    constructor(command: string, argv: string[], font: string, font_size: number, on_quit: Function) {
        super();

        this.store = Store;
        Dispatcher.dispatch(updateFontFace(font));
        Dispatcher.dispatch(updateFontPx(font_size));
        this.process = new Process(command, argv);

        if (on_quit) {
            this.on('quit', on_quit);
        }
    }

    attachDOM(canvas: HTMLCanvasElement) {
        this.cursor = new Cursor();
        this.input = new Input();
        this.screen = new Screen(canvas);
        this.process
            .attach(this.screen.lines, this.screen.columns)
            .then(() => {
                this.process.client.on('disconnect', () => this.emit('quit'));
                this.emit('process-attached');
            });
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
