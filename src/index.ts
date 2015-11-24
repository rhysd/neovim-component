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
                this.width,
                this.height,
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
