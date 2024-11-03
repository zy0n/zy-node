import { beforeEach, describe, it } from "node:test";
import { baseNode, webClientNode, type zkNode } from "./node.js";
import {
  generateNodeAddresses,
  generatePrivateKey,
  getIPAddress,
} from "./utils.js";
// import { generateSeed } from "./utils.js";

const testTopic = "test-topic";
const mainSeed = new Uint8Array([
  215, 24, 226, 44, 127, 255, 102, 250, 110, 148, 103, 62, 66, 82, 221, 139,
  166, 170, 82, 204, 1, 100, 22, 169, 93, 50, 176, 43, 191, 16, 6, 72,
]);

const mainPrivateKey = await generatePrivateKey(mainSeed);

const mainMultiaddrs: string[] = [];
const currentIP = await getIPAddress();

const currentAddresses = generateNodeAddresses([8000, 60000], currentIP);
console.log("currentAddresses", currentAddresses);
// const newAddresses: string[] = [];
describe("Node", () => {
  let zyNode: zkNode;
  beforeEach(async () => {
    zyNode = await baseNode(mainPrivateKey);
    // no need to connect to bootstrap peers
    mainMultiaddrs.push(...zyNode.getMultiaddrs());
    zyNode.subscribe(testTopic, (data) => {
      console.log("Node Received data: ", data);
    });
    zyNode.printPublicMultiaddrs();
  });
  it("should be able to create a client node", async () => {
    // test goes here
    const client = await webClientNode(mainMultiaddrs);
    await client.connect();
    // console.log("client", client);
    client.printMultiaddrs();
    const da = client.getMultiaddrs();
    console.log("da", da);
    const data = {
      message: "Hello from client",
    };
    const data2 = {
      message: "Hello from client 2",
    };
    client.subscribe(testTopic, (data) => {
      console.log("Client Received data: ", data);
    });
    setInterval(() => {
      client.send(testTopic, data);
      zyNode.send(testTopic, data2);
    }, 1000);
  });
});
