import React from 'react';

const Home: React.FC<{ onEnter: () => void }> = ({ onEnter }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
    <h1>Ledger Live d’épargne crypto</h1>
    <button style={{ fontSize: 24, padding: '16px 32px' }} onClick={onEnter}>
      Entrer
    </button>
  </div>
);

export default Home;
