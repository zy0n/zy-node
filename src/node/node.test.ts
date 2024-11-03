import {
  //  beforeEach,
  describe,
  it,
} from "node:test";
import {
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
// const newAddresses: string[] = [];
describe("Node", () => {
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
    // const data2 = {
    //   message: "Hello from client 2",
    // };
    client.subscribe(testTopic, (data) => {
      console.log("Client Received data: ", data);
    });
    setInterval(() => {
      console.log("sending data");
      client.send(testTopic, data);
      //   zyNode.send(testTopic, data2);
    }, 1000);
  });
});
