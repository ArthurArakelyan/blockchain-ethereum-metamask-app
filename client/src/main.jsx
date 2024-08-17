import { createRoot } from 'react-dom/client';

import './index.css'
import App from './App';
import { TransactionProvider } from './context/TransactionContext';

createRoot(document.getElementById('root')).render(
  <TransactionProvider>
    <App />
  </TransactionProvider>
);
