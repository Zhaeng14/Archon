import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, HardDrive, Settings } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
/**
 * Interface for navigation items
 */
export interface NavigationItem {
  path: string;
  icon: React.ReactNode;
  label: string;
}
/**
 * Props for the SideNavigation component
 */
interface SideNavigationProps {
  className?: string;
  'data-id'?: string;
}
/**
 * Tooltip component for navigation items
 */
const NavTooltip: React.FC<{
  show: boolean;
  label: string;
  position?: 'left' | 'right';
}> = ({
  show,
  label,
  position = 'right'
}) => {
  if (!show) return null;
  return <div className={`absolute ${position === 'right' ? 'left-full ml-2' : 'right-full mr-2'} top-1/2 -translate-y-1/2 px-2 py-1 rounded bg-black/80 text-white text-xs whitespace-nowrap z-50`} style={{
    pointerEvents: 'none'
  }}>
      {label}
      <div className={`absolute top-1/2 -translate-y-1/2 ${position === 'right' ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} border-4 ${position === 'right' ? 'border-r-black/80 border-transparent' : 'border-l-black/80 border-transparent'}`}></div>
    </div>;
};
/**
 * SideNavigation - A vertical navigation component
 *
 * This component renders a navigation sidebar with icons and the application logo.
 * It highlights the active route and provides hover effects.
 */
export const SideNavigation: React.FC<SideNavigationProps> = ({
  className = '',
  'data-id': dataId
}) => {
  // State to track which tooltip is currently visible
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const { projectsEnabled } = useSettings();
  
  // Default navigation items
  const navigationItems: NavigationItem[] = [{
    path: '/',
    icon: <BookOpen className="h-5 w-5" />,
    label: 'Knowledge Base'
  }, {
    path: '/mcp',
    icon: <svg fill="currentColor" fillRule="evenodd" height="20" width="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M15.688 2.343a2.588 2.588 0 00-3.61 0l-9.626 9.44a.863.863 0 01-1.203 0 .823.823 0 010-1.18l9.626-9.44a4.313 4.313 0 016.016 0 4.116 4.116 0 011.204 3.54 4.3 4.3 0 013.609 1.18l.05.05a4.115 4.115 0 010 5.9l-8.706 8.537a.274.274 0 000 .393l1.788 1.754a.823.823 0 010 1.18.863.863 0 01-1.203 0l-1.788-1.753a1.92 1.92 0 010-2.754l8.706-8.538a2.47 2.47 0 000-3.54l-.05-.049a2.588 2.588 0 00-3.607-.003l-7.172 7.034-.002.002-.098.097a.863.863 0 01-1.204 0 .823.823 0 010-1.18l7.273-7.133a2.47 2.47 0 00-.003-3.537z"></path><path d="M14.485 4.703a.823.823 0 000-1.18.863.863 0 00-1.204 0l-7.119 6.982a4.115 4.115 0 000 5.9 4.314 4.314 0 006.016 0l7.12-6.982a.823.823 0 000-1.18.863.863 0 00-1.204 0l-7.119 6.982a2.588 2.588 0 01-3.61 0 2.47 2.47 0 010-3.54l7.12-6.982z"></path></svg>,
    label: 'MCP Server'
  }, {
    path: '/settings',
    icon: <Settings className="h-5 w-5" />,
    label: 'Settings'
  }];
  // Logo configuration
  const logoSrc = "/favicon.png";
  const logoAlt = 'Knowledge Base Logo';
  // Get current location to determine active route
  const location = useLocation();
  const isProjectsActive = location.pathname === '/projects' && projectsEnabled;
  
  const logoClassName = `
    logo-container p-2 relative rounded-lg transition-all duration-300
    ${isProjectsActive ? 'bg-muted border border-border' : ''}
    ${projectsEnabled ? 'hover:bg-accent cursor-pointer' : 'opacity-50 cursor-not-allowed'}
  `;
  
  return <div data-id={dataId} className={`flex flex-col items-center gap-6 py-6 px-3 rounded-xl bg-background border border-border shadow-sm ${className}`}>
      {/* Logo - Conditionally clickable based on Projects enabled */}
      {projectsEnabled ? (
        <Link 
          to="/projects"
          className={logoClassName}
          onMouseEnter={() => setActiveTooltip('logo')} 
          onMouseLeave={() => setActiveTooltip(null)}
        >
          <img src={logoSrc} alt={logoAlt} className={`w-8 h-8 transition-all duration-300 ${isProjectsActive ? 'filter ' : ''}`} />
          {/* Active state decorations */}
          {isProjectsActive && <>
              <span className="absolute inset-0 rounded-lg border border-blue-300 dark:border-blue-500/30"></span>
              <span className="absolute bottom-0 left-[15%] right-[15%] w-[70%] mx-auto h-[2px] bg-blue-500 shadow-sm dark:shadow-sm"></span>
            </>}
          <NavTooltip show={activeTooltip === 'logo'} label="Project Management" />
        </Link>
      ) : (
        <div 
          className={logoClassName}
          onMouseEnter={() => setActiveTooltip('logo')} 
          onMouseLeave={() => setActiveTooltip(null)}
        >
          <img src={logoSrc} alt={logoAlt} className="w-8 h-8 transition-all duration-300" />
          <NavTooltip show={activeTooltip === 'logo'} label="Projects Disabled" />
        </div>
      )}
      {/* Navigation links */}
      <nav className="flex flex-col gap-4">
        {navigationItems.map(item => {
        const isActive = location.pathname === item.path;
        return <Link key={item.path} to={item.path} className={`
                relative p-3 rounded-lg flex items-center justify-center
                transition-all duration-300
                ${isActive ? 'bg-muted border border-border text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}
              `} onMouseEnter={() => setActiveTooltip(item.path)} onMouseLeave={() => setActiveTooltip(null)} aria-label={item.label}>
              {/* Active state indicator */}
              {isActive && <span className="absolute inset-0 rounded-lg border border-border"></span>}
              {item.icon}
              {/* Custom tooltip */}
              <NavTooltip show={activeTooltip === item.path} label={item.label} />
            </Link>;
      })}
      </nav>
    </div>;
};

