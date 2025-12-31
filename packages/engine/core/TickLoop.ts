export type TickHandler = () => void;

export class TickLoop {
    private intervalId?: number;

    start(handler: TickHandler, delay = 1000) {
        this.intervalId = window.setInterval(handler, delay);
    }
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }
}