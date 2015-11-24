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
        const canvas = document.querySelector('.neovim-canvas') as HTMLCanvasElement;
        console.log(canvas);
        this.app = new Neovim(
                this.fontSize,
                this.nvimCmd,
                this.argv,
                canvas
            );
    },

    attached: function() {
        this.app.start();
    },
});
