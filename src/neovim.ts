import {EventEmitter} from 'events';
import NeovimProcess from './neovim/process';
import NeovimScreen from './neovim/screen';

export default class Neovim extends EventEmitter {
    process: NeovimProcess;
    screen: NeovimScreen;

    constructor(
            width: number,
            height: number,
            font_size: number,
            command: string,
            argv: string[],
            canvas: HTMLCanvasElement
        ) {
        super();
        this.process = new NeovimProcess(command, argv);
        this.screen = new NeovimScreen(canvas, width, height, font_size);
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
