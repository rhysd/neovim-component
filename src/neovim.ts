import {EventEmitter} from 'events';
import Process from './neovim/process';
import Screen from './neovim/screen';
import NeovimStore from './neovim/store';
import {updateFontPx, updateFontFace, updateScreenSize} from './neovim/actions';
import Cursor from './neovim/cursor';
import Input from './neovim/input';
import Dispatcher from './neovim/dispatcher';

export default class Neovim extends EventEmitter {
    process: Process;
    screen: Screen;
    store: NeovimStore;
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

        this.store = new NeovimStore();

        // Note:
        // Perhaps store should not be singlton because:
        //  1. Store can't be initialized by <neovim-editor> props.
        //  2. Multiple <neovim-editor> component can't exist.
        this.store.dispatcher.dispatch(updateFontFace(font));
        this.store.dispatcher.dispatch(updateFontPx(font_size));
        this.store.dispatcher.dispatch(updateScreenSize(width, height));

        this.process = new Process(this.store, command, argv);
    }

    attachCanvas(canvas: HTMLCanvasElement) {
        this.screen = new Screen(this.store, canvas);
        const {lines, cols} = this.store.size;
        this.process
            .attach(lines, cols)
            .then(() => {
                this.process.client.on('disconnect', () => this.emit('quit'));
                this.emit('process-attached');
            });
        this.cursor = new Cursor(this.store);
        this.input = new Input(this.store);
    }

    changeFontSize(new_size: number) {
        this.screen.updateActualFontSize(new_size);
    }

    resizeScreen(width_px: number, height_px: number) {
        this.screen.resizeScreen(width_px, height_px);
    }

    resizeView(lines: number, cols: number) {
        this.screen.resizeView(lines, cols);
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

    // Note:
    // It is better to use 'argv' property of <neovim-client> for apps using Polymer.
    setArgv(argv: string[]) {
        if (!this.process.started) {
            throw new Error("Process is not attached yet.  Use 'process-attached' event to ensure to specify arguments.");
        }
        return this.process.client.command('args ' + argv.join(' '));
    }
}
