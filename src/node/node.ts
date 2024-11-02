import { gossipsub } from "@chainsafe/libp2p-gossipsub";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { identify, identifyPush } from "@libp2p/identify";
import { tcp } from "@libp2p/tcp";
import { webSockets } from "@libp2p/websockets";
import { createLibp2p } from "libp2p";
// import { multiaddr } from "multiaddr";
// import { fromString as uint8ArrayFromString } from "uint8arrays/from-string";
// import { toString as uint8ArrayToString } from "uint8arrays/to-string";

const createNode = async (addresses?: string[]) => {
  const node = await createLibp2p({
    addresses: {
      listen: addresses ?? ["/ip4/0.0.0.0/tcp/0", "/ip4/0.0.0.0/tcp/0/ws"],
    },
    transports: [tcp(), webSockets()],
    streamMuxers: [yamux()],
    connectionEncrypters: [noise()],
    services: {
      pubsub: gossipsub(),
      identify: identify(),
      identifyPush: identifyPush(),
    },
  });

  return node;
};

export class Node {
  constructor(public value: number, public next: Node | null = null) {}
}
