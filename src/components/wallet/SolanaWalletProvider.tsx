import { PrivyProvider } from '@privy-io/react-auth';
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana';

const solanaConnectors = toSolanaWalletConnectors({
  shouldAutoConnect: true,
});

const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID || '';

export default function SolanaWalletProvider({ children }: { children: React.ReactNode }) {
  if (!PRIVY_APP_ID) {
    console.warn('[Privy] VITE_PRIVY_APP_ID not set');
    return <>{children}</>;
  }

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#00FF7F',
        },
        loginMethods: ['email', 'google', 'twitter', 'wallet'],
        externalWallets: {
          solana: { connectors: solanaConnectors },
        },
        embeddedWallets: {
          solana: {
            createOnLogin: 'users-without-wallets',
          },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
