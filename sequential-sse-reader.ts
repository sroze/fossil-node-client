import * as EventSource from "eventsource";

export class SequentialSseReader {
  private source?: EventSource;

  constructor(private readonly url: string)
  {}

  read(handler: (event: MessageEvent) => Promise<void>): Promise<void> {
    return new Promise((resolve, reject) =>{
      this.source = new EventSource(this.url);
      let sequentialPromise = Promise.resolve();

      this.source.onmessage = async (message: MessageEvent) => {
        sequentialPromise = sequentialPromise.then(async () => {
          await handler(message);
        });
      };

      this.source.onerror = error => {
        reject(error);
      };
    });
  }

  close(error?: Error) {
    if (this.source) {
      if (error) {
        this.source.emit('error', error);
      }

      this.source.close();
    }
  }
}
