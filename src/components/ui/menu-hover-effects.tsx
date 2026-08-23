import React, { useState } from 'react';

export interface NavItem {
  id: string;
  label: string;
}

export interface NavMenuProps {
  items?: (string | NavItem)[];
  activeTab?: string;
  onSelectTab?: (id: string) => void;
  className?: string;
}

const defaultItems: NavItem[] = [
  { id: 'console', label: 'console' },
  { id: 'nodes', label: 'nodes' },
  { id: 'ingest', label: 'ingest' },
  { id: 'history', label: 'history' },
  { id: 'evaluate', label: 'evaluate' }
];

export default function NavMenu({
  items,
  activeTab,
  onSelectTab,
  className = ''
}: NavMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [localActive, setLocalActive] = useState<string>(
    activeTab || (items && items.length > 0 ? (typeof items[0] === 'string' ? items[0] : items[0].id) : 'console')
  );

  const currentActive = activeTab !== undefined ? activeTab : localActive;

  const normalizedItems: NavItem[] = (items || defaultItems).map((item) => {
    if (typeof item === 'string') {
      return { id: item, label: item };
    }
    return item;
  });

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleItemClick = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setLocalActive(id);
    if (onSelectTab) {
      onSelectTab(id);
    }
    setIsMenuOpen(false);
  };

  return (
    <nav className={`relative w-full ${className}`} aria-label="Main Navigation">
      {/* Mobile Menu Toggle Button */}
      <button 
        type="button"
        onClick={toggleMenu}
        className="lg:hidden flex items-center justify-center p-2.5 rounded-xl border border-[var(--border-structure)] bg-[var(--bg-surface)] text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-cyan)] transition cursor-pointer min-h-[44px] min-w-[44px]"
        aria-controls="responsive-main-nav"
        aria-expanded={isMenuOpen}
        aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
      >
        <div className="flex flex-col items-center justify-center w-5 h-5 space-y-1">
          <div className={`w-5 h-0.5 bg-current transition-transform duration-300 ${isMenuOpen ? 'transform rotate-45 translate-y-1.5' : ''}`}></div>
          <div className={`w-5 h-0.5 bg-current transition-opacity duration-300 ${isMenuOpen ? 'opacity-0' : ''}`}></div>
          <div className={`w-5 h-0.5 bg-current transition-transform duration-300 ${isMenuOpen ? 'transform -rotate-45 -translate-y-1.5' : ''}`}></div>
        </div>
      </button>
      
      {/* Navigation Links Container */}
      <div 
        id="responsive-main-nav"
        className={`
          w-full transition-all duration-300
          ${isMenuOpen ? 'block absolute top-full left-0 right-0 z-50 mt-2 p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-structure)] backdrop-blur-2xl shadow-2xl' : 'hidden lg:flex items-center justify-center'}
        `}
      >
        <ul className="flex flex-col lg:flex-row items-stretch lg:items-center space-y-2 lg:space-y-0 lg:space-x-3 xl:space-x-5">
          {normalizedItems.map((item) => {
            const isActive = currentActive.toLowerCase() === item.id.toLowerCase();
            return (
              <li key={item.id} className="list-none">
                <a 
                  href={`#${item.id}`}
                  className="relative inline-block w-full lg:w-auto group rounded-xl"
                  onClick={(e) => handleItemClick(item.id, e)}
                >
                  {/* Link Text */}
                  <span className={`
                    relative z-10 block uppercase font-sans font-semibold tracking-wider transition-colors duration-300 
                    text-xs py-3 px-4 lg:py-1.5 lg:px-3.5 text-center lg:text-left min-h-[44px] lg:min-h-0 flex items-center justify-center
                    ${isActive ? 'text-[var(--text-main)] font-bold bg-[var(--bg-surface-hover)] lg:bg-transparent rounded-lg lg:rounded-none' : 'text-[var(--text-muted)] group-hover:text-[var(--text-main)]'}
                  `}>
                    {item.label}
                  </span>

                  {/* Desktop Underline Effect */}
                  <span className={`
                    hidden lg:block absolute inset-0 border-t-2 border-b-2 border-[var(--border-structure)]
                    transform transition-all duration-300 origin-center
                    ${isActive 
                      ? 'scale-y-100 opacity-100 border-isro-orange' 
                      : 'scale-y-[2] opacity-0 group-hover:scale-y-100 group-hover:opacity-100'}
                  `} />
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
