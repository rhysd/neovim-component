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
        nvimCmd: {
            type: String,
            value: 'nvim',
        },
        argv: {
            type: Array,
            value: () => [] as string[],
        },
        neovim: Object,
    },

    ready: function() {
        this.app = new Neovim(this.nvimCmd, this.argv);
    },

    attached: function() {
        const canvas = document.querySelector('.neovim-canvas') as HTMLCanvasElement;
        this.app.attachDOM(canvas, this.fontSize);
    },
});
