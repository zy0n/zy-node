import { tcp } from "@libp2p/tcp";
import { webSockets } from "@libp2p/websockets";
import { type Libp2p } from "libp2p";
import {
  createBaseNode,
  createClientNode,
  decodeEvent,
  type ValidatorFunction,
} from "./utils.js";
import { BOOTSTRAP_PEERS } from "./constants.js";
import { multiaddr } from "multiaddr";

export class Node {
  private libp2p: Libp2p;
  private subscriptionMap: Map<string, Array<(data: unknown) => void>> =
    new Map();
  constructor(libp2p: Libp2p) {
    this.libp2p = libp2p;
    // connect node to bootstrap peers.
    if (BOOTSTRAP_PEERS.length > 0) {
      this.libp2p.dial(BOOTSTRAP_PEERS.map((peer) => multiaddr(peer)));
    } else {
      throw new Error("No bootstrap peers provided.");
    }
  }

  async baseNode() {
    const libp2p = await createBaseNode();
    return new Node(libp2p);
  }

  async clientNode() {
    const libp2p = await createClientNode([tcp()] as never);
    return new Node(libp2p);
  }

  async webClientNode() {
    const libp2p = await createClientNode([webSockets()] as never);
    return new Node(libp2p);
  }

  printMultiaddrs() {
    console.log("Listening on:");
    this.libp2p.getMultiaddrs().forEach((addr) => {
      console.log(`${addr}`);
    });
  }

  eventHandler(event: CustomEvent) {
    const { topic } = event.detail;
    const decoded = decodeEvent(event);
    console.log("Received message on topic: ", topic);
    if (this.subscriptionMap.has(topic)) {
      const callbacks = this.subscriptionMap.get(topic);
      console.log("Firing off callbacks: ", callbacks?.length);
      callbacks?.forEach((callback) => {
        callback(decoded);
      });
    }
  }

  subscribe(topic: string, callback: (data: unknown) => void) {
    // @ts-expect-error libp2p needs proper typing
    this.libp2p.services.pubsub.subscribe(topic);
    if (this.subscriptionMap.has(topic)) {
      const callbacks = this.subscriptionMap.get(topic);
      callbacks?.push(callback);
    } else {
      this.subscriptionMap.set(topic, [callback]);
    }
  }

  unsubscribe(topic: string) {
    console.log("Unsubscribing from topic: ", topic);
    // @ts-expect-error libp2p needs proper typing
    this.libp2p.services.pubsub.unsubscribe(topic);
    this.subscriptionMap.delete(topic);
  }

  unsubscribeAll() {
    console.log("Unsubscribing from all topics");
    for (const [topic] of this.subscriptionMap) {
      this.unsubscribe(topic);
    }
  }

  send(topic: string, data: unknown) {
    // @ts-expect-error libp2p needs proper typing
    this.libp2p.services.pubsub.publish(topic, data);
  }

  // usd for fee validation
  validator(topic: string, validatorFunc: ValidatorFunction) {
    // @ts-expect-error libp2p needs proper typing
    this.libp2p.services.pubsub.topicValidators.set(topic, validatorFunc);
  }
}
