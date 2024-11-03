import {
  //  beforeEach,
  describe,
  it,
} from "node:test";
import {
  clientNode,
  //   baseNode,
  //   webClientNode,
  type zkNode,
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
let nodeCount = 0;
const spawnNode = async () => {
  const node = await clientNode(mainMultiaddrs);
  await node.connect();
  console.log("Spawned node", ++nodeCount);
  const nodeIndex = nodeCount;
  node.subscribe(testTopic, (data) => {
    console.log(`Client ${nodeIndex} Received data: ${data}`);
  });
  node.printMultiaddrs();
  return node;
};

const spawnChatter = async (node: zkNode, index: number) => {
  const data = {
    message: `Hello from client ${index}`,
    timestamp: Date.now(),
  };

  const interval = setInterval(() => {
    data.timestamp = Date.now();
    node.send(testTopic, data);
  }, 5000);

  setTimeout(() => {
    clearInterval(interval);
    node.stop();
  }, 35000);
};

// const killNodes = (nodes: zkNode[]) => {
//   nodes.forEach((node) => {
//     node.stop();
//   });
// };

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

const runSequence = async () => {
  const nodes: zkNode[] = [];
  const randomSeconds = 1000 * (Math.floor(Math.random() * 5) + 1);
  for (let i = 0; i < 2; i++) {
    spawnNode().then((node) => {
      nodes.push(node);
      spawnChatter(node, i);
    });
    await delay(randomSeconds);
  }

  //   setTimeout(() => {
  //     killNodes(nodes);
  //   }, 65000);
};

const runGauntlet = async () => {
  for (let i = 0; i < 1; i++) {
    runSequence();
    await delay(10000);
  }
};

describe("Node", () => {
  it("should be able to create a client node", async () => {
    await runGauntlet();
    // const client = await webClientNode(mainMultiaddrs);
    // await client.connect();
    // client.printMultiaddrs();
    // const da = client.getMultiaddrs();
    // console.log("da", da);
    // const data = {
    //   message: "Hello from client",
    //   timestamp: Date.now(),
    // };
    // client.subscribe(testTopic, (data) => {
    //   console.log("Client Received data: ", data);
    // });
    // const interval = setInterval(() => {
    //   data.timestamp = Date.now();
    //   client.send(testTopic, data);
    // }, 1000);

    // setTimeout(() => {
    //   clearInterval(interval);
    //   client.stop();
    // }, 5000);
  });

  //   it("should be able to create a second client node", async () => {
  //     const client = await clientNode(mainMultiaddrs);
  //     await client.connect();
  //     client.printMultiaddrs();
  //     const da = client.getMultiaddrs();
  //     console.log("da", da);
  //     const data = {
  //       message: "Hello from Second client",
  //       timestamp: Date.now(),
  //     };
  //     client.subscribe(testTopic, (data) => {
  //       console.log("Second Client Received data: ", data);
  //     });
  //     const interval = setInterval(() => {
  //       data.timestamp = Date.now();
  //       console.log("Sending data: ", data);
  //       client.send(testTopic, data);
  //     }, 1000);

  //     setTimeout(() => {
  //       clearInterval(interval);
  //       client.stop();
  //     }, 5000);
  //   });
});
