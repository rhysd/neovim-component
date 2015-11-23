import {EventEmitter} from 'events';
import NeovimProcess from './neovim/process';

export default class Neovim extends EventEmitter {
    process: NeovimProcess;

    constructor(
            width: number,
            height: number,
            fontSize: number,
            command: string,
            argv: string[],
            canvas: HTMLCanvasElement
        ) {
        super();
        this.process = new NeovimProcess(command, argv);
    }

    start() {
        // this.process.attach(lines, columns);
    }

    quit() {
        this.process.finalize();
    }
}
