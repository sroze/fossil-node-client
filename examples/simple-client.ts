import Client from "../index";

(async () => {
  const client = new Client({
    baseUrl: 'http://localhost:8080',
    consumerName: 'foo',
    withInflux: {
      host: "localhost",
      database: "fossil"
    }
  });

  await client.consume("prefix/*", event => {
    console.log(event);

    return Promise.resolve();
  });
})();
