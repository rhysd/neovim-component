require('mocha-generators').install();

var Nightmare = require('nightmare');
var assert = require('chai').assert;

var HTML_URL = 'file://' + __dirname + '/default.html'

describe('Default component', function() {
    var elem;

    before(function*() {
        var nightmare = Nightmare({
            electronPath: require('electron-prebuilt'),
            'web-preferences': {
                'node-integration': true
            }
        });
        elem = yield nightmare
            .goto(HTML_URL)
            .evaluate(() => document.getElementById('neovim'));
        yield nightmare.end();
    });

    it('exists in DOM', function*() {
        assert.ok(elem);
        assert.ok(elem.isAttached);
        assert.ok(elem.editor);
    });

    it('sets default properties', function*() {
        assert.strictEqual(elem.font, 'monospace');
        assert.strictEqual(elem.fontSize, 12);
        assert.strictEqual(elem.nvimCmd, 'nvim');
        assert.isDefined(elem.argv);
    });
});
