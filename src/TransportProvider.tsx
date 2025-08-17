import React, { ReactNode } from "react";
import { WalletAPIProvider } from "@ledgerhq/wallet-api-client-react";
import { WindowMessageTransport } from "@ledgerhq/wallet-api-client";

const TransportProvider = ({ children }: { children: ReactNode }) => {
  function getWalletAPITransport() {
    if (typeof window === "undefined") {
      return { onMessage: undefined, send: () => {} };
    }
    const transport = new WindowMessageTransport();
    transport.connect();
    return transport;
  }
  const transport = getWalletAPITransport();
  return <WalletAPIProvider transport={transport}>{children}</WalletAPIProvider>;
};

export default TransportProvider;
