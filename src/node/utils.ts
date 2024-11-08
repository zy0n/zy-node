import { gossipsub, type GossipsubEvents } from "@chainsafe/libp2p-gossipsub";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import {
  circuitRelayServer,
  type CircuitRelayService,
} from "@libp2p/circuit-relay-v2";
import {
  identify,
  identifyPush,
  type Identify,
  type IdentifyPush,
} from "@libp2p/identify";
import {
  TopicValidatorResult,
  type PrivateKey,
  type PubSub,
} from "@libp2p/interface";
import { tcp } from "@libp2p/tcp";
import { webSockets } from "@libp2p/websockets";
import * as filters from "@libp2p/websockets/filters";
import { createLibp2p, type Libp2p } from "libp2p";

// import { multiaddr } from "multiaddr";
// import { fromString as uint8ArrayFromString } from "uint8arrays/from-string";
import { toString as uint8ArrayToString } from "uint8arrays/to-string";
import { generateKeyPairFromSeed } from "@libp2p/crypto/keys";
import { randomBytes } from "crypto";
import axios from "axios";
// import { createFromPrivKey } from "@libp2p/peer-id-factory";

export const generatePrivateKey = async (seed: Uint8Array) => {
  const privateKey = await generateKeyPairFromSeed("Ed25519", seed);
  return privateKey;
};

export const generateSeed = () => {
  const seed = randomBytes(32);
  return seed;
};

type CreateNodeOptions = {
  addresses?: string[];
  transports?: never;
  privateKey?: PrivateKey;
};

export const createRelayNode = async ({
  addresses,
  privateKey,
}: CreateNodeOptions) => {
  const node = await createLibp2p({
    addresses: {
      listen: addresses ?? ["/ip4/0.0.0.0/tcp/0", "/ip4/0.0.0.0/tcp/0/ws"],
    },
    transports: [
      tcp(),
      webSockets({
        filter: filters.all,
      }),
    ],
    connectionEncrypters: [noise()],
    streamMuxers: [yamux()],
    services: {
      identify: identify(),
      relay: circuitRelayServer({
        reservations: {
          maxReservations: Infinity,
        },
      }),
    },
    privateKey: privateKey ?? (await generatePrivateKey(randomBytes(32))),
  });
  return node;
};

const createNode = async ({
  addresses,
  transports,
  privateKey,
}: CreateNodeOptions) => {
  const options = {
    addresses: {
      listen: addresses ?? ["/ip4/0.0.0.0/tcp/0", "/ip4/0.0.0.0/tcp/0/ws"],
    },
    // node/native need TCP only
    // web need WebSockets only
    transports: transports ?? [tcp(), webSockets()],
    streamMuxers: [
      yamux({
        //   /**
        //    * The total number of inbound protocol streams that can be opened on a given connection
        //    *
        //    * This field is optional, the default value is shown
        //    */
        //   maxInboundStreams: 100,
        //   /**
        //    * The total number of outbound protocol streams that can be opened on a given connection
        //    *
        //    * This field is optional, the default value is shown
        //    */
        //   maxOutboundStreams: 100,
      }),
    ],
    connectionEncrypters: [noise()],

    services: {
      pubsub: gossipsub({
        runOnLimitedConnection: true,
        allowPublishToZeroTopicPeers: true,
      }),
      identify: identify(),
      identifyPush: identifyPush(),
    },
    privateKey: privateKey ?? (await generatePrivateKey(randomBytes(32))),
    connectionManager: {
      /**
       * The total number of connections allowed to be open at one time
       */
      maxConnections: 100,

      /**
       * How many connections can be open but not yet upgraded
       */
      maxIncomingPendingConnections: 100,

      /**
       * A remote peer may attempt to open up to this many connections per second,
       * any more than that will be automatically rejected
       */
      inboundConnectionThreshold: 100,
    },
  };

  const node = await createLibp2p(options);

  return node;
};
export const generateNodeAddresses = (ports?: number[], ip?: string) => {
  const addresses = [];

  const ipAddress = ip ?? "0.0.0.0";
  if (typeof ports !== "undefined") {
    if (ports.length > 0) {
      addresses.push(`/ip4/${ipAddress}/tcp/${ports[0]}`);
      if (ports.length > 1) {
        addresses.push(`/ip4/${ipAddress}/tcp/${ports[1]}/ws`);
      }
      return addresses;
    }
  }
  return [`/ip4/${ipAddress}/tcp/0`, `/ip4/${ipAddress}/tcp/0/ws`];
};

export const createBaseNode = async (
  ports?: number[],
  privateKey?: PrivateKey
): Promise<Libp2pNode> => {
  // Create a libp2p node
  // 'network' nodes
  const addresses = generateNodeAddresses(ports);
  const node = await createNode({ addresses, privateKey });
  return node;
};

export const createClientNode = async (
  transports?: never
): Promise<Libp2pNode> => {
  // Create a libp2p node
  // 'client' nodes
  // supplying [] for the node addresses will cause it to not 'accept' connections, but allow messages to be sent.
  const node = await createNode({ transports });
  return node;
};

export const decodeEvent = (event: CustomEvent) => {
  //   console.log("TOPIC", event.detail.topic);
  return uint8ArrayToString(event.detail.data);
};

export type Libp2pNode =
  | Libp2p<{
      pubsub: PubSub<GossipsubEvents>;
      identify: Identify;
      identifyPush: IdentifyPush;
    }>
  | Libp2p<{
      identify: Identify;
      relay: CircuitRelayService;
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

export const getIPAddress = async () => {
  const ip = await axios.get("https://api.ipify.org");
  return ip.data;
};
