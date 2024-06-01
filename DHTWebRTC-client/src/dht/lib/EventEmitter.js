class EventEmitter extends EventTarget {
    constructor(events) {
        super();

        for (const event of events) {
            this.init(event);
        }
    }

    init(event) {
        Object.defineProperty(this, `on${event}`, {
            set(handler) {
                this.on(event, handler);
            }
        });
    }

    on(event, handler) {
        this.addEventListener(event, handler);
    }

    emit(event, args) {
        this.dispatchEvent(new CustomEvent(event, {
            detail: args
        }));
    }
}

export default EventEmitter;