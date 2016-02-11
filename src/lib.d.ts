/// <reference path="../typings/browser.d.ts" />

declare namespace NodeJS {
    interface Global {
        require(mod: string): any;
    }
}

interface ObjectConstructor {
    assign(x: Object, ...xs: Object[]): Object;
}

interface String {
    repeat(n: number): string;
}

interface KeyboardEvent {
    code: string;
}

