import React from 'react';

interface PlatformPageProps {
  platform: 'morpho' | 'aave';
  hasPosition: boolean;
  onDeposit: () => void;
  onSwitch: () => void;
}

const PlatformPage: React.FC<PlatformPageProps> = ({ platform, hasPosition, onDeposit, onSwitch }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <h2>Plateforme recommandée : {platform === 'morpho' ? 'Morpho' : 'Aave'}</h2>
      {!hasPosition ? (
        <button style={{ fontSize: 20, padding: '12px 24px' }} onClick={onDeposit}>
          Déposer sur {platform}
        </button>
      ) : (
        <button style={{ fontSize: 20, padding: '12px 24px' }} onClick={onSwitch}>
          Switcher vers {platform}
        </button>
      )}
    </div>
  );
};

export default PlatformPage;
