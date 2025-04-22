import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
import {
  getWalletClient as getViemWalletClient,
  getConnections,
} from "@wagmi/core";
import { config } from "../../wagmi";


export const publicClient = createPublicClient({
  chain: base,
  transport: http(process.env.NEXT_PUBLIC_RPC),
});

export async function getWalletClient() {
  const connections = getConnections(config);
  const client = await getViemWalletClient(config, {
    connector: connections[0]?.connector,
  });

  return client;
}

export function isConnected() {
  return getAccount().isConnected;
}
