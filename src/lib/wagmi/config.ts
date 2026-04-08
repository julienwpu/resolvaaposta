import { createConfig, http } from "wagmi"
import { polygon } from "wagmi/chains"

export const wagmiConfig = createConfig({
  chains: [polygon],
  transports: {
    [polygon.id]: http(process.env.NEXT_PUBLIC_POLYGON_RPC_URL ?? "https://polygon-rpc.com"),
  },
})
