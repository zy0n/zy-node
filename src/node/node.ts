import { tcp } from "@libp2p/tcp";
import { webSockets } from "@libp2p/websockets";
import { type Libp2p } from "libp2p";
import { createBaseNode, createClientNode } from "./utils.js";
export class Node {
  private libp2p: Libp2p;
  private subscriptionMap: Map<string, Array<(data: unknown) => void>> =
    new Map();
  constructor(libp2p: Libp2p) {
    this.libp2p = libp2p;
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

  eventHandler = (event: CustomEvent) => {
    // check subscriptionMap to determine if we have a callback for this topic.
    const { topic, data } = event.detail;

    if (this.subscriptionMap.has(topic)) {
      const callbacks = this.subscriptionMap.get(topic);
      callbacks?.forEach((callback) => {
        callback(data);
      });
    }
  };

  subscribe(topic: string, callback: (data: unknown) => void) {
    // @ts-expect-error libp2p needs proper typing
    this.libp2p.services.pubsub.subscribe(topic);
    if (this.subscriptionMap.has(topic)) {
      const callbacks = this.subscriptionMap.get(topic);
      callbacks?.push(callback);
    } else {
      this.subscriptionMap.set(topic, [callback]);
    }
    // add Callback
  }

  //
}
