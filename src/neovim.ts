import Process from './neovim/process';
import Screen from './neovim/screen';
import Store, {NeovimStore as StoreType} from './neovim/store';
import Dispatcher from './neovim/dispatcher';
import {ActionType} from './neovim/actions';

export default class Neovim {
    process: Process;
    screen: Screen;
    store: StoreType;
    dispatcher: Flux.Dispatcher<ActionType>;

    constructor(
            width: number,
            height: number,
            font_size: number,
            command: string,
            argv: string[],
            canvas: HTMLCanvasElement
        ) {
        this.store = Store;
        this.dispatcher = Dispatcher;
        this.screen = new Screen(canvas, width, height, font_size);
        this.process = new Process(command, argv);
    }

    start() {
        this.screen.initializeCanvas();
        console.log(this.screen);
        this.process.attach(this.screen.lines, this.screen.columns);
    }

    quit() {
        this.process.finalize();
    }
}
