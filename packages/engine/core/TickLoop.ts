export type TickHandler = () => void;

export class TickLoop {
  private intervalId?: ReturnType<typeof setInterval>;

  start(handler: TickHandler, delay = 1000) {
    if (this.intervalId !== undefined) return;
    this.intervalId = setInterval(handler, delay);
  }

  stop() {
    if (this.intervalId === undefined) return;
    clearInterval(this.intervalId);
    this.intervalId = undefined;
  }
}
