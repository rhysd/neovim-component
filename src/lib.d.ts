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

interface SurrogatePairStatic {
    countCodePoints(str: string): number;
    substr(s: string, startCodePoints: number, codePoints?: number): string;
    findSurrogatePair(s: string): boolean;
    checkHighSurrogate(charCode: number): boolean;
    checkLowSurrogate(charCode: number): boolean;
}

declare module 'surrogate-pair' {
    const sp: SurrogatePairStatic;
    export = sp;
}
