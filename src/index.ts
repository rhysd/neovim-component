import Neovim from './neovim';

Polymer({
    is: 'neovim-editor',

    properties: {
        width: {
            type: Number,
            value: 800,
        },
        height: {
            type: Number,
            value: 600,
        },
        fontSize: {
            type: Number,
            value: 12,
        },
        font: {
            type: String,
            value: 'monospace',
        },
        nvimCmd: {
            type: String,
            value: 'nvim',
        },
        argv: {
            type: Array,
            value: () => [] as string[],
        },
        editor: Object,
        onProcessAttached: Object,
        onQuit: Object,
    },

    ready: function() {
        this.editor = new Neovim(
                this.nvimCmd,
                this.argv,
                this.font,
                this.fontSize,
                this.width,
                this.height
            );

        if (this.onQuit) {
            this.editor.on('quit', this.onQuit);
        }

        if (this.onProcessAttached) {
            this.editor.on('process-attached', this.onProcessAttached);
        }
    },

    attached: function() {
        const canvas = document.querySelector('.neovim-canvas') as HTMLCanvasElement;
        this.editor.attachDOM(canvas);
    },

    detached: function() {
        this.editor.emit('detach');
    },

    attributeChanged: function(name: string, type: polymer.PropConstructorType) {
        this.editor.emit('change-attribute', name, type);
    },
});
