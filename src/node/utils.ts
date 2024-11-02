import { gossipsub, type GossipsubEvents } from "@chainsafe/libp2p-gossipsub";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import {
  identify,
  identifyPush,
  type Identify,
  type IdentifyPush,
} from "@libp2p/identify";
import { TopicValidatorResult, type PubSub } from "@libp2p/interface";
import { tcp } from "@libp2p/tcp";
import { webSockets } from "@libp2p/websockets";
import { createLibp2p, type Libp2p } from "libp2p";

// import { multiaddr } from "multiaddr";
// import { fromString as uint8ArrayFromString } from "uint8arrays/from-string";
import { toString as uint8ArrayToString } from "uint8arrays/to-string";
const createNode = async (addresses?: string[], transports?: never) => {
  const node = await createLibp2p({
    addresses: {
      listen: addresses ?? ["/ip4/0.0.0.0/tcp/0", "/ip4/0.0.0.0/tcp/0/ws"],
    },
    // node/native need TCP only
    // web need WebSockets only
    transports: transports ?? [tcp(), webSockets()],
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
const generateNodeAddresses = (ports?: number[]) => {
  const addresses = [];
  if (typeof ports !== "undefined") {
    if (ports.length > 0) {
      addresses.push(`/ip4/0.0.0.0.tcp/${ports[0]}`);
      if (ports.length > 1) {
        addresses.push(`/ip4/0.0.0.0.tcp/${ports[1]}/ws`);
      }
    }
  }
  return ["/ip4/0.0.0.0/tcp/0", "/ip4/0.0.0.0/tcp/0/ws"];
};

export const createBaseNode = async (ports?: number[]): Promise<Libp2pNode> => {
  // Create a libp2p node
  // 'network' nodes
  const addresses = generateNodeAddresses(ports);
  const node = await createNode(addresses);
  return node;
};

export const createClientNode = async (
  transports?: never
): Promise<Libp2pNode> => {
  // Create a libp2p node
  // 'client' nodes
  // supplying [] for the node addresses will cause it to not 'accept' connections, but allow messages to be sent.
  const node = await createNode([], transports);
  return node;
};

export const decodeEvent = (event: CustomEvent) => {
  //   console.log("TOPIC", event.detail.topic);
  return uint8ArrayToString(event.detail.data);
};

export type Libp2pNode = Libp2p<{
  pubsub: PubSub<GossipsubEvents>;
  identify: Identify;
  identifyPush: IdentifyPush;
}>;

export const validateSender = (
  msgTopic: string,
  event: { data: Uint8Array }
) => {
  const messageData = uint8ArrayToString(event.data);
  // check if the sender is blacklisted
  const extractedData = JSON.parse(messageData) as { sender: string };
  const sender = extractedData.sender;
  const blacklist = ["bad-sender"];

  if (blacklist.includes(sender)) {
    return TopicValidatorResult.Reject;
  }
  return TopicValidatorResult.Accept;
};

export type ValidatorFunction = (
  msgTopic: string,
  event: { data: Uint8Array }
) => TopicValidatorResult;
