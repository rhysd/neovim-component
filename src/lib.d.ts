/// <reference path="../typings/tsd.d.ts" />

declare namespace NodeJS {
    interface Global {
        require(mod: string): any;
    }
}
