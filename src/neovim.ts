import Process from './neovim/process';
import Screen from './neovim/screen';
import Store, {NeovimStore as StoreType} from './neovim/store';
import {ActionType} from './neovim/actions';
import Cursor from './neovim/cursor';

export default class Neovim {
    process: Process;
    screen: Screen;
    store: StoreType;

    constructor(command: string, argv: string[]) {
        this.store = Store;
        this.process = new Process(command, argv);
    }

    attachDOM(canvas: HTMLCanvasElement, font_size: number) {
        this.screen = new Screen(canvas, font_size);
        this.process.attach(this.screen.lines, this.screen.columns);
    }

    quit() {
        this.process.finalize();
    }

    getClient() {
        return this.process.client;
    }
}
