import { CloudEvent, ConsumerInterface } from "./named-consumer";
import { InfluxDB, FieldType, ISingleHostConfig } from "influx";
import { hostname } from "os";

export class InfluxMonitor implements ConsumerInterface {
  private influx: InfluxDB;
  private buffer = [];

  constructor(
    private readonly consumer: ConsumerInterface,
    private readonly configuration: ISingleHostConfig,
    private readonly consumerName: string
  ) {
    this.influx = new InfluxDB({
      ...configuration,

      schema: [
        {
          measurement: "fossil_consumer",
          fields: {
            stream: FieldType.STRING,
            lag: FieldType.INTEGER,
            duration: FieldType.INTEGER
          },
          tags: ["host", "consumer"]
        }
      ]
    });
  }

  consume(matcher: string, handler: (message: CloudEvent) => Promise<void>) {
    const publishInterval = setInterval(async () => {
      const toPublish = this.buffer;
      this.buffer = [];

      console.log(`Consuming at ${toPublish.length} eps`);
      await this.influx.writePoints(toPublish);
    }, 1000);

    try {
      return this.consumer.consume(matcher, async message => {
        const {fossilstream: stream, time} = message;
        const lag = time ? new Date().valueOf() - Date.parse(time) : 0;

        const point = {
          measurement: "fossil_consumer",
          tags: {host: hostname(), consumer: this.consumerName},
          fields: {stream, lag, duration: 0},
          timestamp: new Date()
        };

        try {
          return await handler(message);
        } finally {
          point.fields.duration =
            new Date().valueOf() - point.timestamp.valueOf();

          this.buffer.push(point);
        }
      });
    } finally {
      clearInterval(publishInterval);
    }
  }
}
