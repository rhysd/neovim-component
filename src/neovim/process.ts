// Note:
// Use renderer's node.js integration to avoid using ipc for large data transfer
import cp = require('child_process');
const child_process: typeof cp = global.require('child_process');
import NvimClient = require('promised-neovim-client');
const attach = (global.require('promised-neovim-client') as typeof NvimClient).attach;
import Action = require('./actions');
import NeovimStore from './store';
import log from '../log';

// Note:
// TypeScript doesn't allow recursive definition
export type RPCValue =
        NvimClient.Buffer |
        NvimClient.Window |
        NvimClient.Tabpage |
        number |
        boolean |
        string |
        any[] |
        {[key: string]: any};

export default class NeovimProcess {
    neovim_process: cp.ChildProcess;
    client: NvimClient.Nvim;
    started: boolean;

    constructor(
        private store: NeovimStore,
        public command: string,
        public argv: string[],
    ) {
        this.started = false;
        this.argv.unshift('--embed');
    }

    attach(lines: number, columns: number) {
        let err: Error = null;
        this.client = null;

        this.neovim_process
            = child_process.spawn(
                this.command,
                this.argv,
                {stdio: ['pipe', 'pipe', process.stderr]},
            );
        this.neovim_process.on('error', (e: Error) => { err = e; });

        if (err || this.neovim_process.pid === undefined) {
            return Promise.reject(err || new Error('Failed to spawn process: ' + this.command));
        }

        return attach(this.neovim_process.stdin, this.neovim_process.stdout)
            .then(nvim => {
                this.client = nvim;
                nvim.on('request', this.onRequested.bind(this));
                nvim.on('notification', this.onNotified.bind(this));
                nvim.on('disconnect', this.onDisconnected.bind(this));
                nvim.uiAttach(columns, lines, true, true /*notify*/);
                this.started = true;
                log.info(`nvim attached: ${this.neovim_process.pid} ${lines}x${columns} ${JSON.stringify(this.argv)}`);
                this.store.on('input', (i: string) => nvim.input(i));
                this.store.on('update-screen-bounds', () => nvim.uiTryResize(this.store.size.cols, this.store.size.lines));

                // Note:
                // Neovim frontend has responsiblity to emit 'GUIEnter' on initialization.
                this.client.command('doautocmd <nomodeline> GUIEnter');
            });
    }

    onRequested(method: string, args: RPCValue[], response: RPCValue) {
        log.info('requested: ', method, args, response);
    }

    onNotified(method: string, args: RPCValue[]) {
        if (method === 'redraw') {
            this.redraw(args as RPCValue[][]);
        } else {
            // User defined notifications are passed here.
            log.debug('Unknown method', method, args);
        }
    }

    onDisconnected() {
        log.info('disconnected: ' + this.neovim_process.pid);
        // TODO:
        // Uncomment below line to close window on quit.
        // I don't do yet for debug.
        // global.require('electron').remote.getCurrentWindow().close();
        this.started = false;
    }

    finalize() {
        return this.client.uiDetach().then(() => {
            this.client.quit();
            this.started = false;
        });
    }

    private redraw(events: RPCValue[][]) {
        const d = this.store.dispatcher;
        for (const e of events) {
            const name = e[0] as string;
            const args = e[1] as RPCValue[];
            switch (name) {
                case 'put':
                    e.shift();
                    if (e.length !== 0) {
                        d.dispatch(Action.putText(e as string[][]));
                    }
                    break;
                case 'cursor_goto':
                    d.dispatch(Action.cursor(args[0] as number, args[1] as number));
                    break;
                case 'highlight_set':
                    e.shift();

                    // Note:
                    // [[{highlight_set}], [], [{highlight_set}], ...]
                    //   -> [{highlight_set}, {highlight_set}, ...]
                    const highlights = [].concat.apply([], e) as Action.HighlightSet[];

                    // Note:
                    // [{highlight_set}, {highlight_set}, ...]
                    //   -> {merged highlight_set}
                    highlights.unshift({});
                    const merged_highlight = Object.assign.apply(Object, highlights) as Action.HighlightSet;

                    d.dispatch(Action.highlight(merged_highlight));
                    break;
                case 'clear':
                    d.dispatch(Action.clearAll());
                    break;
                case 'eol_clear':
                    d.dispatch(Action.clearEndOfLine());
                    break;
                case 'scroll':
                    d.dispatch(Action.scrollScreen(args[0] as number));
                    break;
                case 'set_scroll_region':
                    d.dispatch(Action.setScrollRegion({
                        top: args[0] as number,
                        bottom: args[1] as number,
                        left: args[2] as number,
                        right: args[3] as number,
                    }));
                    break;
                case 'resize':
                    d.dispatch(Action.resize(args[1] as number, args[0] as number));
                    break;
                case 'update_fg':
                    d.dispatch(Action.updateForeground(args[0] as number));
                    break;
                case 'update_bg':
                    d.dispatch(Action.updateBackground(args[0] as number));
                    break;
                case 'update_sp':
                    d.dispatch(Action.updateSpecialColor(args[0] as number));
                    break;
                case 'mode_change':
                    d.dispatch(Action.changeMode(args[0] as string));
                    break;
                case 'busy_start':
                    d.dispatch(Action.startBusy());
                    break;
                case 'busy_stop':
                    d.dispatch(Action.stopBusy());
                    break;
                case 'mouse_on':
                    d.dispatch(Action.enableMouse());
                    break;
                case 'mouse_off':
                    d.dispatch(Action.disableMouse());
                    break;
                case 'bell':
                    d.dispatch(Action.bell(false));
                    break;
                case 'visual_bell':
                    d.dispatch(Action.bell(true));
                    break;
                case 'set_title':
                    d.dispatch(Action.setTitle(args[0] as string));
                    break;
                case 'set_icon':
                    d.dispatch(Action.setIcon(args[0] as string));
                    break;
                default:
                    log.warn('Unhandled event: ' + name, args);
                    break;
            }
        }
    }
}

