import React, { useState } from 'react';
import { X, Wifi, WifiOff } from 'lucide-react';
import { DisconnectScreen } from './animations/DisconnectScreenAnimations';
import { button } from './ui/button';

interface DisconnectScreenOverlayProps {
  isActive: boolean;
  onDismiss?: () => void;
}

export const DisconnectScreenOverlay: React.FC<DisconnectScreenOverlayProps> = ({
  isActive,
  onDismiss
}) => {
  const [showControls, setShowControls] = useState(false);

  if (!isActive) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black"
      onMouseMove={() => setShowControls(true)}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setTimeout(() => setShowControls(false), 3000)}
    >
      {/* Disconnect Screen Animation */}
      <DisconnectScreen />

      {/* Override Button */}
      <div 
        className={`absolute bottom-8 right-8 transition-opacity duration-500 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
};
