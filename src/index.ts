import Neovim from './neovim';

Polymer({
    is: 'neovim-editor',

    properties: {
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
        editor: Object,
        onProcessAttached: Object,
        onQuit: Object,
        onError: Object,
        resizeHandler: Object,
    },

    ready: function() {
        this.editor = new Neovim(
                this.$,
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
    },

    attached: function() {
        (Polymer.RenderStatus as any).beforeNextRender(this, function() {
            // measure something
            const parent: HTMLCanvasElement = this.$.container;
            const canvas: HTMLCanvasElement = this.$.screen;
            const width = this.width || parent.offsetWidth;
            const height = this.height || parent.offsetHeight;
            this.editor.attachCanvas(width, height, canvas);
            this.resize_listener = () => {
                if (this.resizeHandler !== null) {
                    clearTimeout(this.resizeHandler);
                }
                this.resizeHandler = setTimeout(
                        () => {
                            this.editor.screen.checkShouldResize();
                            this.resizeHandler = null;
                        },
                        100,
                    );
            };
            window.addEventListener('resize', this.resize_listener);
        });
    },

    detached: function() {
        this.editor.emit('detach');
        if (this.resize_listener) {
            window.removeEventListener('resize', this.resize_listener);
        }
    },

    attributeChanged: function(name: string, type: polymer.PropConstructorType) {
        if (this.editor === undefined) {
            return;
        }
        this.editor.emit('change-attribute', name, type);
    },
});
