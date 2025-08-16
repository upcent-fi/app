import React, { useState } from 'react';
import Home from './Home';
import PlatformPage from './PlatformPage';

// Dummy GraphQL query function to simulate platform selection
async function fetchBestPlatform(): Promise<'morpho' | 'aave'> {
  // Replace with real GraphQL query to your envio indexer
  // For now, randomly pick one
  return Math.random() > 0.5 ? 'morpho' : 'aave';
}

function App() {
  const [page, setPage] = useState<'home' | 'platform'>("home");
  const [platform, setPlatform] = useState<'morpho' | 'aave' | null>(null);
  const [hasPosition, setHasPosition] = useState(false); // Simulate user position

  const handleEnter = async () => {
    const best = await fetchBestPlatform();
    setPlatform(best);
    // Simulate: check if user has a position (replace with real logic)
    setHasPosition(false); // Always false for now
    setPage('platform');
  };

  const handleDeposit = () => {
    // Here you would call the Morpho or Aave service to build the tx and send to Ledger
    alert(`Déposer sur ${platform}`);
    setHasPosition(true);
  };

  const handleSwitch = () => {
    // Here you would call the withdraw+deposit logic
    alert(`Switch de plateforme vers ${platform}`);
  };

  if (page === 'home') {
    return <Home onEnter={handleEnter} />;
  }

  if (platform) {
    return (
      <PlatformPage
        platform={platform}
        hasPosition={hasPosition}
        onDeposit={handleDeposit}
        onSwitch={handleSwitch}
      />
    );
  }

  return null;
}

export default App;
