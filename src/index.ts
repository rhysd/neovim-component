import Neovim, { DOM } from './neovim';

class NeovimEditor extends Polymer.Element {
    static get is() {
        return 'neovim-editor';
    }

    static get properties() {
        return {
            width: Number,
            height: Number,
            fontSize: {
                type: Number,
                value: 12,
            },
            font: {
                type: String,
                value: 'monospace',
            },
            lineHeight: {
                type: Number,
                value: 1.3,
            },
            nvimCmd: {
                type: String,
                value: 'nvim',
            },
            argv: {
                type: Array,
                value: () => [] as string[],
            },
            disableAltKey: {
                type: Boolean,
                value: false,
            },
            disableMetaKey: {
                type: Boolean,
                value: false,
            },
            cursorDrawDelay: {
                type: Number,
                value: 10,
            },
            noBlinkCursor: {
                type: Boolean,
                value: false,
            },
            windowTitle: {
                type: String,
                value: 'Neovim',
            },
            onProcessAttached: Object,
            onQuit: Object,
            onError: Object,
        };
    }

    width: number;
    height: number;
    fontSize: number;
    font: string;
    lineHeight: number;
    nvimCmd: string;
    argv: string[];
    disableAltKey: boolean;
    disableMetaKey: boolean;
    cursorDrawDelay: number;
    noBlinkCursor: boolean;
    windowTitle: string;
    editor: Neovim;
    onProcessAttached: () => void;
    onQuit: () => void;
    onError: (err: Error) => void;
    resizeHandler: NodeJS.Timer;
    resizeListener: () => void;

    ready() {
        super.ready();
        this.editor = new Neovim(
            this.$ as DOM,
            this.nvimCmd,
            this.argv,
            this.font,
            this.fontSize,
            this.lineHeight,
            this.disableAltKey,
            this.disableMetaKey,
            this.cursorDrawDelay,
            !this.noBlinkCursor,
            this.windowTitle,
        );
        this.resizeHandler = null;

        if (this.onError) {
            this.editor.on('error', this.onError);
        }

        if (this.onQuit) {
            this.editor.on('quit', this.onQuit);
        }

        if (this.onProcessAttached) {
            this.editor.on('process-attached', this.onProcessAttached);
        }
    }

    connectedCallback() {
        super.connectedCallback();
        Polymer.RenderStatus.afterNextRender(this, function() {
            // measure size of element
            const parent: HTMLCanvasElement = this.$.container;
            const canvas: HTMLCanvasElement = this.$.screen;
            const width = this.width || parent.offsetWidth;
            const height = this.height || parent.offsetHeight;
            this.editor.attachCanvas(width, height, canvas);
            this.resizeListener = () => {
                if (this.resizeHandler !== null) {
                    clearTimeout(this.resizeHandler);
                }
                this.resizeHandler = setTimeout(() => {
                    this.editor.screen.checkShouldResize();
                    this.resizeHandler = null;
                }, 100);
            };
            window.addEventListener('resize', this.resizeListener);
        });
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.editor.emit('detach');
        if (this.resizeListener) {
            window.removeEventListener('resize', this.resizeListener);
        }
    }

    attributeChangedCallback(name: string, oldVal: string | null, newVal: string | null) {
        // @ts-ignore: https://github.com/Polymer/polymer/issues/5087
        super.attributeChangedCallback(name, oldVal, newVal);
        if (this.editor === undefined) {
            return;
        }
        this.editor.emit('change-attribute', name, oldVal, newVal);
    }
}

customElements.define(NeovimEditor.is, NeovimEditor);
