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
    <nav className={`relative w-full ${className}`}>
      {/* Mobile menu toggle button */}
      <button 
        onClick={toggleMenu}
        className="md:hidden absolute top-3 right-4 z-20 p-2 text-zinc-200"
        aria-label={isMenuOpen ? "Close menu" : "Open menu"}
      >
        <div className={`w-6 h-0.5 bg-current mb-1.5 transition-transform duration-300 ${isMenuOpen ? 'transform rotate-45 translate-y-2' : ''}`}></div>
        <div className={`w-6 h-0.5 bg-current mb-1.5 transition-opacity duration-300 ${isMenuOpen ? 'opacity-0' : ''}`}></div>
        <div className={`w-6 h-0.5 bg-current transition-transform duration-300 ${isMenuOpen ? 'transform -rotate-45 -translate-y-2' : ''}`}></div>
      </button>
      
      {/* Menu container */}
      <div className={`
        flex items-center justify-center w-full
        ${isMenuOpen ? 'block' : 'hidden md:flex'}
      `}>
        <ul className="flex flex-col items-center space-y-4 md:flex-row md:space-y-0 md:space-x-3 lg:space-x-6">
          {normalizedItems.map((item) => {
            const isActive = currentActive.toLowerCase() === item.id.toLowerCase();
            return (
              <li key={item.id} className="list-none">
                <a 
                  href={`#${item.id}`}
                  className="relative inline-block group"
                  onClick={(e) => handleItemClick(item.id, e)}
                >
                  {/* Link text */}
                  <span className={`
                    relative z-10 block uppercase font-sans font-semibold tracking-wider transition-colors duration-300 
                    text-xs py-1.5 px-2.5 md:text-xs md:py-1 md:px-3 lg:text-xs lg:py-1.5 lg:px-3.5
                    ${isActive ? 'text-[var(--text-main)] font-bold' : 'text-[var(--text-muted)] group-hover:text-[var(--text-main)]'}
                  `}>
                    {item.label}
                  </span>

                  {/* Top & bottom border animation */}
                  <span className={`
                    absolute inset-0 border-t-2 border-b-2 border-[var(--border-structure)]
                    transform transition-all duration-300 origin-center
                    ${isActive 
                      ? 'scale-y-100 opacity-100 border-isro-orange' 
                      : 'scale-y-[2] opacity-0 group-hover:scale-y-100 group-hover:opacity-100'}
                  `} />

                  {/* Background fill animation */}
                  <span className={`
                    absolute top-[2px] left-0 w-full h-full bg-[var(--bg-surface)]
                    transform transition-all duration-300 origin-top
                    ${isActive 
                      ? 'scale-100 opacity-100 shadow-sm' 
                      : 'scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100'}
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
