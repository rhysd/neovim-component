import {RPCValue} from './process';

export enum Kind {
    Redraw,
};

export interface RedrawActionType {
    type: Kind;
    events: RPCValue[][];
}

export function redraw(events: RPCValue[][]) {
    return {
        type: Kind.Redraw,
        events
    };
}

export type ActionType = RedrawActionType;
