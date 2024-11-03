import {
  //  beforeEach,
  describe,
  it,
} from "node:test";
import {
  clientNode,
  //   baseNode,
  webClientNode,
  // type zkNode
} from "./node.js";
import {
  generateNodeAddresses,
  //   generatePrivateKey,
  getIPAddress,
} from "./utils.js";
// import { generateSeed } from "./utils.js";

const testTopic = "test-topic";

const mainMultiaddrs: string[] = [
  "/ip4/54.167.24.167/tcp/8000/p2p/12D3KooWT19bnNKeLFPBHAtz1WhWrgiqJB76T6ikVwV4MCxtGjvd",
  "/ip4/54.167.24.167/tcp/60000/ws/p2p/12D3KooWT19bnNKeLFPBHAtz1WhWrgiqJB76T6ikVwV4MCxtGjvd",
];
const currentIP = await getIPAddress();

const currentAddresses = generateNodeAddresses([8000, 60000], currentIP);
console.log("currentAddresses", currentAddresses);
describe("Node", () => {
  it("should be able to create a client node", async () => {
    const client = await webClientNode(mainMultiaddrs);
    await client.connect();
    client.printMultiaddrs();
    const da = client.getMultiaddrs();
    console.log("da", da);
    const data = {
      message: "Hello from client",
      timestamp: Date.now(),
    };
    client.subscribe(testTopic, (data) => {
      console.log("Client Received data: ", data);
    });
    const interval = setInterval(() => {
      data.timestamp = Date.now();
      client.send(testTopic, data);
    }, 1000);

    setTimeout(() => {
      clearInterval(interval);
      client.stop();
    }, 5000);
  });

  it("should be able to create a second client node", async () => {
    const client = await clientNode(mainMultiaddrs);
    await client.connect();
    client.printMultiaddrs();
    const da = client.getMultiaddrs();
    console.log("da", da);
    const data = {
      message: "Hello from Second client",
      timestamp: Date.now(),
    };
    client.subscribe(testTopic, (data) => {
      console.log("Second Client Received data: ", data);
    });
    const interval = setInterval(() => {
      data.timestamp = Date.now();
      client.send(testTopic, data);
    }, 1000);

    setTimeout(() => {
      clearInterval(interval);
      client.stop();
    }, 5000);
  });
});
