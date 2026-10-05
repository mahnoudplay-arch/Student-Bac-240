import React from 'react';
import { PWAInstallPrompt } from './PWAInstallPrompt';

export const PWAInstallButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return <PWAInstallPrompt variant="navbar" className={className} />;
};

export default PWAInstallButton;
