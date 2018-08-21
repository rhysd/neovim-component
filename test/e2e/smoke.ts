import * as path from 'path';
import { Application } from 'spectron';
import { assert } from 'chai';

// XXX: Get Electron binary path
const electron: string = (require as any)('electron');

describe('neovim element', function() {
    this.timeout(10000);
    before(function() {
        this.app = new Application({
            path: electron,
            args: [path.join(__dirname, '..', '..', '..')],
            env: {
                NODE_ENV: 'production',
            },
        });
        return this.app.start().then(() => this.app.client.pause(3000)); // Wait application starting
    });

    after(function() {
        if (this.app.isRunning()) {
            return this.app.stop();
        }
    });

    it('can start without an error', function() {
        return this.app.client
            .getWindowCount()
            .then((c: number) => assert.equal(c, 1))
            .then(() => this.app.browserWindow.isVisible())
            .then((b: boolean) => assert.isTrue(b))
            .then(() => this.app.webContents.getURL())
            .then((u: string) => assert.ok(u))
            .then(() =>
                this.app.client.execute(() => {
                    const e = document.getElementById('neovim') as any;
                    if (!e) {
                        return null;
                    }
                    return e.editor.screen.ctx.getImageData(10, 10, 1, 1);
                }),
            )
            .then((returned: { value: { data: Uint8ClampedArray } }) => {
                const rgba = returned.value.data;
                assert.equal(rgba.length, 4);
                // White means nothing may not be rendered
                assert.isFalse(rgba[0] === 255 && rgba[1] === 255 && rgba[2] === 255);
            })
            .then(() => this.app.client.getRenderProcessLogs())
            .then((logs: any[]) => {
                for (const log of logs) {
                    assert.notEqual(log.level, 'error', log.message);
                }
            })
            .then(() => this.app.client.getMainProcessLogs())
            .then((logs: string[]) => {
                assert.equal(
                    logs.filter(
                        m =>
                            !['net::ERR_FILE_NOT_FOUND', 'Electron Security Warning', 'Unhandled event:'].some(w =>
                                m.includes(w),
                            ),
                    ).length,
                    0,
                    logs.toString(),
                );
            });
    });
});
