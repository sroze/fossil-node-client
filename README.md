# Fossil NodeJS client

This is a Node client for the [Fossil event store](https://github.com/sroze/fossil). It does support 
[named consumers](https://github.com/sroze/fossil#named-consumers) and [explicit consumer acknowledgments](https://github.com/sroze/fossil#wait-for-consumers).

## Installation

```
npm i @fossil/node-client
```

## Usage

```js
import Client from "@fossil/node-client";

(async () => {
  const client = new Client({
    baseUrl: 'https://fossil.your-company.com',
    consumerName: 'foo',
  });

  await client.consume("prefix/*", async event => {
    // Do what you need to do with the event...
    console.log(event);
  });
})();
```
