import { initializeNative } from './utils/native';
void initializeNative();
import {StrictMode, Suspense, lazy} from 'react';
import {createRoot} from 'react-dom/client';
import {MotionConfig} from 'motion/react';
import App from './App.tsx';
import './index.css';
import './soft-ui.css';

const AdminApp = lazy(() => import('./components/AdminApp'));
const isAdminRoute = /^\/admin\/?$/.test(window.location.pathname);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <Suspense fallback={<main className="grid min-h-screen place-items-center bg-[#f6f5f0] text-sm text-[#51625d]">Loading...</main>}>
        {isAdminRoute ? <AdminApp /> : <App />}
      </Suspense>
    </MotionConfig>
  </StrictMode>,
);
