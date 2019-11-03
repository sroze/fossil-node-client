import {ConsumerInterface, MessageHandler, NamedConsumer} from "./named-consumer";
import {ISingleHostConfig} from "influx";
import {AcknowledgeWhenExpected} from "./acknowledgments";
import {InfluxMonitor} from "./influx";

export type Options = {
  // Base URL for the Fossil HTTP endpoints.
  // Example: https://fossil.mydomain.com/
  baseUrl: string;

  // Name of the consumer.
  // Note: At the moment, this library doesn't support anonymous consumers.
  consumerName: string;

  // If you want the client to automatically push metrics to InfluxDB,
  // set the following configuration.
  withInflux?: ISingleHostConfig;
}

export default class Client implements ConsumerInterface {
  private readonly consumer: ConsumerInterface;

  constructor(options: Options) {
    this.consumer =
      new AcknowledgeWhenExpected(
        new NamedConsumer(options.baseUrl, options.consumerName),
        options.baseUrl,
        options.consumerName
      );

    if (options.withInflux) {
      this.consumer = new InfluxMonitor(
        this.consumer,
        options.withInflux,
        options.consumerName
      )
    }
  }

  consume(matcher: string, handler: MessageHandler): Promise<void> {
    return this.consumer.consume(matcher, handler);
  }
}
