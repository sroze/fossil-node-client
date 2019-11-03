import axios from 'axios';
import {CloudEvent, ConsumerInterface, MessageHandler} from "./named-consumer";

const expectedConsumersExtensionName = 'fossilconsumerswaitedforacknowledgment';

export class AcknowledgeWhenExpected implements ConsumerInterface {
  constructor(
    private readonly consumer: ConsumerInterface,
    private readonly fossilBaseUrl: string,
    private readonly consumerName: string,
  ) {}

  consume(matcher: string, handler: MessageHandler): Promise<void> {
    return this.consumer.consume(matcher, async event => {
      await handler(event);

      if (expectedConsumersExtensionName in event) {
        const expectedConsumers = event[expectedConsumersExtensionName].split(',');

        if (expectedConsumers.indexOf(this.consumerName) !== -1) {
          await this.acknowledge(event);
        }
      }
    });
  }

  async acknowledge(event: CloudEvent) {
    await axios.post(`${this.fossilBaseUrl}/events/${event.id}/ack`, {
      consumer_name: this.consumerName,
    })
  }
}
