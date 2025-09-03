import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PowerButton } from './PowerButton';
import { LucideIcon } from 'lucide-react';

interface CollapsibleSettingsCardProps {
  title: string;
  icon: LucideIcon;
  accentColor?: 'neutral' | 'purple' | 'green' | 'pink' | 'blue' | 'cyan' | 'orange';
  children: React.ReactNode;
  defaultExpanded?: boolean;
  storageKey?: string;
}

export const CollapsibleSettingsCard: React.FC<CollapsibleSettingsCardProps> = ({
  title,
  icon: Icon,
  accentColor = 'neutral',
  children,
  defaultExpanded = true,
  storageKey
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isFlickering, setIsFlickering] = useState(false);

  // Load saved state from localStorage
  useEffect(() => {
    if (storageKey) {
      const saved = localStorage.getItem(`settings-card-${storageKey}`);
      if (saved !== null) {
        setIsExpanded(saved === 'true');
      }
    }
  }, [storageKey]);

  const handleToggle = () => {
    if (isExpanded) {
      // Start flicker animation when collapsing
      setIsFlickering(true);
      setTimeout(() => {
        setIsExpanded(false);
        setIsFlickering(false);
        if (storageKey) {
          localStorage.setItem(`settings-card-${storageKey}`, 'false');
        }
      }, 300); // Duration of flicker animation
    } else {
      // No flicker when expanding
      setIsExpanded(true);
      if (storageKey) {
        localStorage.setItem(`settings-card-${storageKey}`, 'true');
      }
    }
  };

  const iconColorMap = {
    neutral: 'text-foreground/70',
    purple: 'text-gray-600 dark:text-gray-400',
    green: 'text-gray-600 dark:text-gray-400', 
    pink: 'text-gray-600 dark:text-gray-400',
    blue: 'text-gray-600 dark:text-gray-400',
    cyan: 'text-gray-600 dark:text-gray-400',
    orange: 'text-gray-600 dark:text-gray-400'
  };

  return (
    <motion.div
      animate={isFlickering ? {
        opacity: [1, 0.3, 1, 0.5, 1, 0.2, 1],
      } : {}}
      transition={{
        duration: 0.3,
        times: [0, 0.1, 0.2, 0.3, 0.6, 0.8, 1],
      }}
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Icon className={`mr-2 ${(iconColorMap as any)[accentColor] ?? iconColorMap.neutral} size-5`} />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              {title}
            </h2>
          </div>
          <PowerButton
            isOn={isExpanded}
            onClick={handleToggle}
            color={'neutral'}
            size={36}
          />
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {isExpanded && !isFlickering && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{
                height: {
                  duration: 0.3,
                  ease: [0.04, 0.62, 0.23, 0.98]
                },
                opacity: {
                  duration: 0.2,
                  ease: "easeInOut"
                }
              }}
              style={{ overflow: 'hidden' }}
            >
              <motion.div
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                exit={{ y: -20 }}
                transition={{
                  duration: 0.2,
                  ease: "easeOut"
                }}
              >
                {children}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

