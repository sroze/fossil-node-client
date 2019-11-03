import { URL } from "url";
import axios from "axios";
import {SequentialSseReader} from "./sequential-sse-reader";

export interface ConsumerInterface {
  consume(matcher: string, handler: MessageHandler): Promise<void>;
}

export type CloudEvent = {
  id: string;
  type: string;
  fossilstream: string;
  fossilsequenceinstream: string;
  fossileventnumber: string;
  data: any;

  [extension: string]: any;
};

export type MessageHandler = (message: CloudEvent) => Promise<void>;

export class NamedConsumer implements ConsumerInterface {
  private lastEventNumber?: string;
  private lastCommittedEventNumber?: string;

  private commitInterval?: NodeJS.Timeout;
  private reader?: SequentialSseReader;

  constructor(
    private readonly fossilBaseUrl: string,
    private readonly consumerName: string,
    private readonly commitIntervalInMs: number = 500
  ) {}

  async consume(matcher: string, handler: MessageHandler): Promise<void> {
    const url = new URL(
      `${this.fossilBaseUrl}/consumer/${this.consumerName}/stream`
    );
    url.searchParams.append("matcher", matcher);

    this.reader = new SequentialSseReader(url.toString());
    this.commitInterval = setInterval(async () => {
      try {
        await this.commit();
      } catch (e) {
        this.tearDown(e);
      }
    }, this.commitIntervalInMs);

    try {
      await this.reader.read(async message => {
        const event: CloudEvent = JSON.parse(message.data);
        await handler(event);

        this.lastEventNumber = event.fossileventnumber;
      });
    } catch (e) {
      this.tearDown();

      throw e;
    }
  }

  tearDown(error?: Error) {
    if (this.reader) {
      this.reader.close(error);
    }

    if (this.commitInterval) {
      clearInterval(this.commitInterval);
    }
  }

  private async commit() {
    if (!this.lastEventNumber || this.lastEventNumber === this.lastCommittedEventNumber) {
      return;
    }

    await axios.put(
      `${this.fossilBaseUrl}/consumer/${this.consumerName}/commit`,
      {},
      {
        headers: {
          "Last-Fossil-Event-Number": this.lastEventNumber
        }
      }
    );

    this.lastCommittedEventNumber = this.lastEventNumber;
  }
}
