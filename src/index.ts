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

    ready: () => {
        const canvas = document.querySelector('.neovim-screen') as HTMLCanvasElement;
        console.log(canvas);
        this.neovim = new Neovim(
                this.width,
                this.height,
                this.fontSize,
                this.nvimCmd,
                this.argv,
                canvas);
    }
});
