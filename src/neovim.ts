import {EventEmitter} from 'events';
import Process from './neovim/process';
import Screen from './neovim/screen';
import NeovimStore from './neovim/store';
import {updateFontPx, updateFontFace, updateScreenSize} from './neovim/actions';
import {Nvim} from 'promised-neovim-client';

export default class Neovim extends EventEmitter {
    process: Process;
    screen: Screen;
    store: NeovimStore;

    constructor(
            command: string,
            argv: string[],
            font: string,
            font_size: number
    ) {
        super();

        this.store = new NeovimStore();
        this.store.dispatcher.dispatch(updateFontFace(font));
        this.store.dispatcher.dispatch(updateFontPx(font_size));

        this.process = new Process(this.store, command, argv);
    }

    attachCanvas(width: number, height: number, canvas: HTMLCanvasElement) {
        this.store.dispatcher.dispatch(updateScreenSize(width, height));
        this.screen = new Screen(this.store, canvas);
        const {lines, cols} = this.store.size;
        this.process
            .attach(lines, cols)
            .then(() => {
                this.process.client.on('disconnect', () => this.emit('quit'));
                this.emit('process-attached');
            });
    }

    quit() {
        this.process.finalize();
    }

    getClient(): Nvim {
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
