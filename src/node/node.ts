import { tcp } from "@libp2p/tcp";
import { webSockets } from "@libp2p/websockets";
import { PrivateKey } from "@libp2p/interface";
import { type Libp2p } from "libp2p";
import {
  createBaseNode,
  createClientNode,
  decodeEvent,
  generateNodeAddresses,
  getIPAddress,
  type ValidatorFunction,
} from "./utils.js";
import { BOOTSTRAP_PEERS } from "./constants.js";
import { multiaddr } from "multiaddr";
import { fromString as uint8ArrayFromString } from "uint8arrays/from-string";

export const baseNode = async (privateKey?: PrivateKey) => {
  const libp2p = await createBaseNode([8000, 60000], privateKey);
  return new zkNode(libp2p);
};

export const clientNode = async (bootstrapPeers?: string[]) => {
  const libp2p = await createClientNode([tcp()] as never);
  return new zkNode(libp2p, bootstrapPeers ?? BOOTSTRAP_PEERS);
};

export const webClientNode = async (bootstrapPeers?: string[]) => {
  const libp2p = await createClientNode([webSockets()] as never);
  return new zkNode(libp2p, bootstrapPeers ?? BOOTSTRAP_PEERS);
};
export class zkNode {
  private libp2p: Libp2p;
  private bootStrapPeers: string[];
  private subscriptionMap: Record<string, ((data: unknown) => void)[]>;
  constructor(libp2p: Libp2p, bootStrapPeers: string[] = []) {
    this.libp2p = libp2p;
    this.bootStrapPeers = bootStrapPeers;
    this.subscriptionMap = {};
    this.setupCallbacks();
    // connect node to bootstrap peers.
  }

  setupCallbacks = () => {
    // @ts-expect-error libp2p needs proper typing
    this.libp2p.services.pubsub.addEventListener("message", this.eventHandler);
  };

  async connect() {
    if (this.bootStrapPeers.length > 0) {
      console.log("Connecting to bootstrap peers: ", this.bootStrapPeers);
      await this.libp2p
        .dial(this.bootStrapPeers.map((peer) => multiaddr(peer)))
        .then(() => {
          console.log("Connected to bootstrap peers");
        });
    } else {
      throw new Error("No bootstrap peers provided.");
    }
  }

  getMultiaddrs() {
    return this.libp2p.getMultiaddrs().map((addr) => `${addr}`);
  }

  printMultiaddrs() {
    console.log("Listening on:");
    this.libp2p.getMultiaddrs().forEach((addr) => {
      console.log(`${addr}`);
    });
  }

  async printPublicMultiaddrs() {
    const peerId = this.libp2p.peerId;
    const currentIP = await getIPAddress();

    const currentAddresses = generateNodeAddresses([8000, 60000], currentIP);
    const addresses = currentAddresses.map((addr) => {
      //   console.log("MA", ma);
      return `${addr}/p2p/${peerId}`;
    });
    console.log("Listening On:");
    addresses.forEach((addr) => {
      console.log(addr);
    });
  }

  eventHandler(event: CustomEvent) {
    const { topic } = event.detail;
    const decoded = decodeEvent(event);
    console.log("Received message on topic: ", topic);
    console.log("Decoded message: ", decoded);
    // const subScriptions = this.subscriptionMap;
    // if (subScriptions.includes(topic)) {
    //   const callbacks = this.subscriptionMap[topic];
    //   console.log("Firing off callbacks: ", callbacks?.length);
    //   callbacks?.forEach((callback) => {
    //     callback(decoded);
    //   });
    // }
  }

  subscribe(topic: string, callback: (data: unknown) => void) {
    // @ts-expect-error libp2p needs proper typing
    this.libp2p.services.pubsub.subscribe(topic);
    if (this.subscriptionMap[topic]) {
      const callbacks = this.subscriptionMap[topic];
      callbacks?.push(callback);
    } else {
      this.subscriptionMap[topic] = [callback];
      console.log("Subscribed to topic: ", topic);
    }
  }

  unsubscribe(topic: string) {
    console.log("Unsubscribing from topic: ", topic);
    // @ts-expect-error libp2p needs proper typing
    this.libp2p.services.pubsub.unsubscribe(topic);
    delete this.subscriptionMap[topic];
  }

  unsubscribeAll() {
    console.log("Unsubscribing from all topics");
    for (const topic of Object.keys(this.subscriptionMap)) {
      this.unsubscribe(topic);
    }
  }

  send(topic: string, data: unknown) {
    const msgString = JSON.stringify(data);
    const msgUint8 = uint8ArrayFromString(msgString);
    // @ts-expect-error libp2p needs proper typing
    this.libp2p.services.pubsub.publish(topic, msgUint8);
  }

  // usd for fee validation
  validator(topic: string, validatorFunc: ValidatorFunction) {
    // @ts-expect-error libp2p needs proper typing
    this.libp2p.services.pubsub.topicValidators.set(topic, validatorFunc);
  }

  async stop() {
    this.unsubscribeAll();
    await this.libp2p.stop();
  }

  peerId() {
    return this.libp2p.peerId;
  }
}
