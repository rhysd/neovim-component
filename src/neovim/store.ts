import {EventEmitter} from 'events';
import Dispatcher from './dispatcher';
import {Kind, ActionType} from './actions';

export class NeovimStore extends EventEmitter {
    dispatch_token: string;

    constructor() {
        super();
    }
}

const store = new NeovimStore();
export default store;

store.dispatch_token = Dispatcher.register((action: ActionType) => {
    console.log(action);
    switch(action.type) {
        case Kind.Redraw:
            break;
        default:
            break;
    }
});
