// Note:
// Use renderer's node.js integration to avoid using ipc for large data transfer
import cp = require('child_process');
const child_process: typeof cp = global.require('child_process');
import NvimClient = require('promised-neovim-client');
const attach = (global.require('promised-neovim-client') as typeof NvimClient).attach;
import Action = require('./actions');
import Dispatcher from './dispatcher';
import Store from './store';
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

    constructor(public command: string, public argv: string[]) {
        this.started = false;
        this.argv.push('--embed');
    }

    attach(lines: number, columns: number) {
        this.neovim_process = child_process.spawn(this.command, this.argv, {stdio: ['pipe', 'pipe', process.stderr]});
        this.client = null;
        return attach(this.neovim_process.stdin, this.neovim_process.stdout)
            .then(nvim => {
                this.client = nvim;
                nvim.on('request', this.onRequested.bind(this));
                nvim.on('notification', this.onNotified.bind(this));
                nvim.on('disconnect', this.onDisconnected.bind(this));
                nvim.uiAttach(columns, lines, true);
                this.started = true;
                log.info(`nvim attached: ${this.neovim_process.pid} ${lines}x${columns} ${JSON.stringify(this.argv)}`);
                Store.on('input', (i: string) => nvim.input(i));
                Store.on('update-screen-bounds', () => nvim.uiTryResize(Store.size.cols, Store.size.lines));
            }).catch(err => log.error(err));
    }

    onRequested(method: string, args: RPCValue[], response: RPCValue) {
        log.info('requested: ', method, args, response);
    }

    onNotified(method: string, args: RPCValue[]) {
        if (method === 'redraw') {
            redraw(args as RPCValue[][]);
        } else {
            log.warn('unknown method', method, args);
        }
    }

    onDisconnected() {
        log.info('disconnected: ' + this.neovim_process.pid);
        // TODO:
        // Uncomment below line to close window on quit.
        // I don't do yet for debug.
        // global.require('remote').getCurrentWindow().close();
        this.started = false;
    }

    finalize() {
        this.client.uiDetach();
        this.client.quit();
        this.started = false;
    }
}

function redraw(events: RPCValue[][]) {
    'use strict';
    for (const e of events) {
        const name = e[0] as string;
        const args = e[1] as RPCValue[];
        switch (name) {
            case 'put':
                e.shift();
                if (e.length !== 0) {
                    Dispatcher.dispatch(Action.putText(e as string[][]));
                }
                break;
            case 'cursor_goto':
                Dispatcher.dispatch(Action.cursor(args[0] as number, args[1] as number));
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

                Dispatcher.dispatch(Action.highlight(merged_highlight));
                break;
            case 'clear':
                Dispatcher.dispatch(Action.clearAll());
                break;
            case 'eol_clear':
                Dispatcher.dispatch(Action.clearEndOfLine());
                break;
            case 'resize':
                Dispatcher.dispatch(Action.resize(args[1] as number, args[0] as number));
                break;
            case 'update_fg':
                Dispatcher.dispatch(Action.updateForeground(args[0] as number));
                break;
            case 'update_bg':
                Dispatcher.dispatch(Action.updateBackground(args[0] as number));
                break;
            case 'mode_change':
                Dispatcher.dispatch(Action.changeMode(args[0] as string));
                break;
            case 'busy_start':
                Dispatcher.dispatch(Action.startBusy());
                break;
            case 'busy_stop':
                Dispatcher.dispatch(Action.stopBusy());
                break;
            case 'mouse_on':
                Dispatcher.dispatch(Action.enableMouse());
                break;
            case 'mouse_off':
                Dispatcher.dispatch(Action.disableMouse());
                break;
            case 'bell':
                Dispatcher.dispatch(Action.bell(false));
                break;
            case 'visual_bell':
                Dispatcher.dispatch(Action.bell(true));
                break;
            case 'set_title':
                Dispatcher.dispatch(Action.setTitle(args[0] as string));
                break;
            case 'set_icon':
                Dispatcher.dispatch(Action.setIcon(args[0] as string));
                break;
            default:
                log.warn('Unhandled event: ' + name, args);
                break;
        }
    }
}



