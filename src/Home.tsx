import React from 'react';

interface HomeProps {
  onEnter: () => void;
  onGoToOnrampViewer?: () => void;
}

const Home: React.FC<HomeProps> = ({ onEnter, onGoToOnrampViewer }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '20px' }}>
    <h1>Ledger Live d'épargne crypto</h1>
    
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
      <button style={{ fontSize: 24, padding: '16px 32px', background: '#0070ba', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }} onClick={onEnter}>
        Plateforme d'épargne
      </button>
      
      {onGoToOnrampViewer && (
        <button style={{ fontSize: 18, padding: '12px 24px', background: '#6f42c1', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }} onClick={onGoToOnrampViewer}>
          Tracker USDC
        </button>
      )}
    </div>
    
    <div style={{ marginTop: '30px', textAlign: 'center', color: '#666' }}>
      <h3>Fonctionnalités disponibles :</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        <li>💰 Plateforme d'épargne avec Aave et Morpho</li>
        <li>📊 Tracker d'économies USDC</li>
      </ul>
      <div style={{ marginTop: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px', fontSize: '14px' }}>
        <strong>💡 Simulateur Onramp séparé :</strong><br/>
        <code style={{ background: '#e9ecef', padding: '4px 8px', borderRadius: '4px', fontFamily: 'monospace' }}>
          cd onramp && npm start
        </code>
      </div>
    </div>
  </div>
);

export default Home;
