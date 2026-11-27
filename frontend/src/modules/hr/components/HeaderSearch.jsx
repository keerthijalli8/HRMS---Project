import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Icon } from './Icon.jsx';
import { employeeData, navItems } from '../data/mockData.js';
import { loadAllTasks } from '../services/taskStore.js';
import { loadHolidays } from '../services/holidayStore.js';
import { logEvent } from '../services/auditService.js';

export const HeaderSearch = ({ onNavigate, isMobile = false, className = "" }) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const mobileInputRef = useRef(null);
  const resultsListRef = useRef(null);

  // Detect OS for shortcut display (Cmd+K on macOS, Ctrl+K on Windows/Linux)
  const isMac = useMemo(() => {
    if (typeof window !== "undefined" && typeof navigator !== "undefined") {
      return /Mac|iPod|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
    }
    return false;
  }, []);

  const shortcutLabel = isMac ? "⌘K" : "Ctrl K";

  // Global Ctrl+K / Cmd+K shortcut listener (only active on main instance)
  useEffect(() => {
    if (isMobile) return;

    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (window.innerWidth < 1024) {
          setIsMobileSearchOpen(true);
          setTimeout(() => mobileInputRef.current?.focus(), 100);
        } else {
          inputRef.current?.focus();
          inputRef.current?.select();
          setIsOpen(true);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobile]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-focus mobile input when modal opens
  useEffect(() => {
    if (isMobileSearchOpen) {
      setTimeout(() => mobileInputRef.current?.focus(), 100);
    }
  }, [isMobileSearchOpen]);

  // Query filtering logic
  const searchResults = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return { employees: [], tasks: [], modules: [], leaves: [], totalCount: 0 };
    }

    // 1. Employees filter
    const employees = employeeData
      .filter(emp =>
        (emp.name && emp.name.toLowerCase().includes(trimmed)) ||
        (emp.id && emp.id.toLowerCase().includes(trimmed)) ||
        (emp.dept && emp.dept.toLowerCase().includes(trimmed)) ||
        (emp.role && emp.role.toLowerCase().includes(trimmed)) ||
        (emp.email && emp.email.toLowerCase().includes(trimmed))
      )
      .slice(0, 4)
      .map(emp => ({
        type: 'employee',
        id: emp.id,
        title: emp.name,
        subtitle: `${emp.id} · ${emp.role} (${emp.dept})`,
        icon: 'user',
        route: 'employees',
        data: emp
      }));

    // 2. Tasks filter
    let allTasks = [];
    try {
      allTasks = loadAllTasks();
    } catch (e) {
      allTasks = [];
    }

    const tasks = allTasks
      .filter(task =>
        (task.title && task.title.toLowerCase().includes(trimmed)) ||
        (task.category && task.category.toLowerCase().includes(trimmed)) ||
        (task.status && task.status.toLowerCase().includes(trimmed)) ||
        (task.priority && task.priority.toLowerCase().includes(trimmed)) ||
        (task.assigneeName && task.assigneeName.toLowerCase().includes(trimmed))
      )
      .slice(0, 4)
      .map(task => ({
        type: 'task',
        id: task.id,
        title: task.title,
        subtitle: `Priority: ${task.priority} · Status: ${task.status}`,
        icon: 'check-square',
        route: 'tasks',
        badge: task.priority,
        data: task
      }));

    // 3. Navigation Modules filter
    const modules = navItems
      .filter(item =>
        item.label.toLowerCase().includes(trimmed) ||
        item.id.toLowerCase().includes(trimmed)
      )
      .slice(0, 4)
      .map(item => ({
        type: 'module',
        id: item.id,
        title: item.label,
        subtitle: `Navigate to ${item.label}`,
        icon: item.icon || 'layout-dashboard',
        route: item.id
      }));

    // 4. Leaves & Holidays filter
    let holidays = [];
    try {
      holidays = loadHolidays();
    } catch (e) {}

    const leaves = [];
    // Leave keywords
    if ("leave management casual sick earned applied leave balance".includes(trimmed)) {
      leaves.push({
        type: 'leave',
        id: 'leave-module',
        title: 'Leave Management',
        subtitle: 'Apply for leaves, view balances & holiday calendar',
        icon: 'calendar',
        route: 'leave'
      });
    }

    holidays
      .filter(h => (h.name && h.name.toLowerCase().includes(trimmed)) || (h.date && h.date.includes(trimmed)))
      .slice(0, 3)
      .forEach(h => {
        leaves.push({
          type: 'holiday',
          id: h.id || h.name,
          title: h.name,
          subtitle: `Holiday · ${h.date}`,
          icon: 'calendar',
          route: 'leave',
          data: h
        });
      });

    const totalCount = employees.length + tasks.length + modules.length + leaves.length;
    return { employees, tasks, modules, leaves, totalCount };
  }, [query]);

  // Flattened array for keyboard index selection
  const flatResults = useMemo(() => {
    return [
      ...searchResults.employees,
      ...searchResults.tasks,
      ...searchResults.modules,
      ...searchResults.leaves
    ];
  }, [searchResults]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(-1);
  }, [query]);

  // Execute selection
  const handleSelectResult = (item) => {
    if (!item) return;

    if (query && query.trim()) {
      try {
        logEvent({
          action: "search_query",
          category: "Navigation",
          module: "Global Search",
          description: `Searched for "${query.trim()}" -> selected ${item.title || item.name || item.route}`,
          target: { type: item.type || "Search", id: item.id || item.route, name: item.title || item.name },
          metadata: { searchQuery: query.trim(), route: item.route }
        });
      } catch (e) {}
    }

    if (item.route && onNavigate) {
      onNavigate(item.route);
    } else if (item.route) {
      window.dispatchEvent(new CustomEvent("hrms_navigate", { detail: item.route }));
    }

    setQuery("");
    setIsOpen(false);
    setIsMobileSearchOpen(false);
  };

  // Keyboard navigation within search input
  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      setIsMobileSearchOpen(false);
      setQuery("");
      return;
    }

    if (!isOpen || flatResults.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (prev < flatResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : flatResults.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < flatResults.length) {
        handleSelectResult(flatResults[selectedIndex]);
      } else if (flatResults.length > 0) {
        handleSelectResult(flatResults[0]);
      }
    }
  };

  const handleClear = () => {
    setQuery("");
    inputRef.current?.focus();
    mobileInputRef.current?.focus();
  };

  // Helper renderer for a single result item
  const renderItem = (item, index) => {
    const isSelected = index === selectedIndex;
    return (
      <button
        key={`${item.type}-${item.id}`}
        type="button"
        onClick={() => handleSelectResult(item)}
        onMouseEnter={() => setSelectedIndex(index)}
        className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between gap-2.5 transition text-xs ${
          isSelected
            ? "bg-accent/15 text-ink border border-accent/30"
            : "hover:bg-surface2 text-muted hover:text-ink border border-transparent"
        }`}
        role="option"
        aria-selected={isSelected}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-surface2 border border-line/60 flex items-center justify-center shrink-0 text-accent">
            <Icon name={item.icon} className="w-3.5 h-3.5 text-accent" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-ink truncate">
              {item.title}
            </div>
            <div className="text-[11px] text-muted truncate">
              {item.subtitle}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {item.badge && (
            <span className="glass-pill px-1.5 py-0.2 text-[10px] text-accent font-semibold border-accent/30">
              {item.badge}
            </span>
          )}
          <Icon name="arrow-right" className="w-3 h-3 text-muted/60" />
        </div>
      </button>
    );
  };

  const renderOverlay = () => (
    <div className="fixed inset-0 z-50 bg-[#06141c]/95 backdrop-blur-xl p-4 flex flex-col gap-3 animate-in fade-in">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 flex items-center bg-surface2 border border-line focus-within:border-accent rounded-full px-3.5 py-2">
          <Icon name="search" className="w-4 h-4 text-muted mr-2 shrink-0" />
          <input
            ref={mobileInputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search modules..."
            className="bg-transparent text-ink placeholder:text-muted/70 text-sm focus:outline-none w-full"
            aria-label="Search modules..."
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-full text-muted hover:text-ink cursor-pointer"
            >
              <Icon name="x" className="w-3.5 h-3.5 text-muted" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            setIsMobileSearchOpen(false);
            setQuery("");
          }}
          className="px-3 py-2 rounded-xl bg-surface2 border border-line text-xs font-semibold text-ink hover:bg-surface2/80 cursor-pointer"
        >
          Cancel
        </button>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-2 mt-1">
        {!query.trim() ? (
          <div className="py-8 text-center text-muted text-xs">
            Type an employee name, ID, task, or module to search...
          </div>
        ) : searchResults.totalCount === 0 ? (
          <div className="py-10 text-center">
            <div className="text-sm font-semibold text-ink">No results found</div>
            <div className="text-xs text-muted mt-1">
              No matches for "{query}".
            </div>
          </div>
        ) : (
          <>
            {searchResults.employees.length > 0 && (
              <div className="flex flex-col gap-1">
                <div className="px-2 text-[11px] font-bold uppercase tracking-wider text-muted">
                  Employees
                </div>
                {searchResults.employees.map((item, idx) => renderItem(item, idx))}
              </div>
            )}
            {searchResults.tasks.length > 0 && (
              <div className="flex flex-col gap-1 pt-2 border-t border-line/40">
                <div className="px-2 text-[11px] font-bold uppercase tracking-wider text-muted">
                  Tasks
                </div>
                {searchResults.tasks.map((item, idx) =>
                  renderItem(item, searchResults.employees.length + idx)
                )}
              </div>
            )}
            {searchResults.modules.length > 0 && (
              <div className="flex flex-col gap-1 pt-2 border-t border-line/40">
                <div className="px-2 text-[11px] font-bold uppercase tracking-wider text-muted">
                  Modules
                </div>
                {searchResults.modules.map((item, idx) =>
                  renderItem(item, searchResults.employees.length + searchResults.tasks.length + idx)
                )}
              </div>
            )}
            {searchResults.leaves.length > 0 && (
              <div className="flex flex-col gap-1 pt-2 border-t border-line/40">
                <div className="px-2 text-[11px] font-bold uppercase tracking-wider text-muted">
                  Leave & Holidays
                </div>
                {searchResults.leaves.map((item, idx) =>
                  renderItem(
                    item,
                    searchResults.employees.length + searchResults.tasks.length + searchResults.modules.length + idx
                  )
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className={`flex shrink-0 ${className}`}>
        <button
          type="button"
          onClick={() => setIsMobileSearchOpen(true)}
          className="w-[44px] h-[44px] rounded-full bg-surface2 border border-line text-muted hover:text-ink hover:border-accent flex items-center justify-center transition cursor-pointer shrink-0"
          aria-label="Open search dialog"
          title="Search employees, tasks, leave..."
        >
          <Icon name="search" className="w-4 h-4 text-muted" />
        </button>
        {isMobileSearchOpen && renderOverlay()}
      </div>
    );
  }

  return (
    <>
      {/* ================= DESKTOP SEARCH BAR (>= 1024px) ================= */}
      <div
        ref={containerRef}
        className={`relative hidden lg:flex flex-[1_1_320px] min-w-[200px] max-w-[320px] xl:max-w-[480px] h-[44px] ${className}`}
      >
        <div className="relative w-full h-[44px] flex items-center bg-surface2/60 hover:bg-surface2/80 focus-within:bg-surface2/95 border border-line focus-within:border-accent/80 focus-within:ring-2 focus-within:ring-accent/20 rounded-[14px] px-3.5 transition-all shadow-sm">
          <Icon name="search" className="w-4 h-4 text-muted group-focus-within:text-accent transition-colors shrink-0 mr-2" />
          
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => {
              if (query.trim()) setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search modules..."
            className="bg-transparent text-ink placeholder:text-muted/70 text-xs focus:outline-none w-full"
            aria-label="Search modules..."
            aria-autocomplete="list"
            aria-expanded={isOpen && Boolean(query.trim())}
          />

          {query ? (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-full text-muted hover:text-ink hover:bg-surface2 transition shrink-0 ml-1 cursor-pointer"
              title="Clear search"
              aria-label="Clear search"
            >
              <Icon name="x" className="w-3 h-3 text-muted" />
            </button>
          ) : (
            <kbd className="inline-flex items-center text-[10px] text-muted bg-surface/80 border border-line/60 rounded px-1.5 py-0.5 font-mono ml-1.5 shrink-0 select-none">
              {shortcutLabel}
            </kbd>
          )}
        </div>

        {/* Dropdown Menu Results */}
        {isOpen && query.trim() && (
          <div
            ref={resultsListRef}
            className="absolute top-full left-0 right-0 mt-2 bg-[#061720]/95 backdrop-blur-2xl border border-line rounded-2xl p-2.5 shadow-2xl z-50 max-h-[380px] overflow-y-auto animate-in fade-in slide-in-from-top-2 flex flex-col gap-2"
            role="listbox"
          >
            {searchResults.totalCount === 0 ? (
              <div className="py-6 px-4 text-center">
                <div className="w-8 h-8 rounded-full bg-surface2 border border-line mx-auto flex items-center justify-center text-muted mb-2">
                  <Icon name="search" className="w-4 h-4 text-muted" />
                </div>
                <div className="text-xs font-semibold text-ink">No results found</div>
                <p className="text-[11px] text-muted mt-1 max-w-xs mx-auto">
                  No matching employees, tasks, leaves or modules found for "{query}".
                </p>
              </div>
            ) : (
              <>
                {searchResults.employees.length > 0 && (
                  <div className="flex flex-col gap-1">
                    <div className="px-2 pt-1 text-[10px] font-bold uppercase tracking-wider text-muted/80">
                      Employees ({searchResults.employees.length})
                    </div>
                    {searchResults.employees.map((item, idx) =>
                      renderItem(item, idx)
                    )}
                  </div>
                )}

                {searchResults.tasks.length > 0 && (
                  <div className="flex flex-col gap-1 border-t border-line/40 pt-1.5">
                    <div className="px-2 pt-1 text-[10px] font-bold uppercase tracking-wider text-muted/80">
                      Tasks ({searchResults.tasks.length})
                    </div>
                    {searchResults.tasks.map((item, idx) =>
                      renderItem(item, searchResults.employees.length + idx)
                    )}
                  </div>
                )}

                {searchResults.modules.length > 0 && (
                  <div className="flex flex-col gap-1 border-t border-line/40 pt-1.5">
                    <div className="px-2 pt-1 text-[10px] font-bold uppercase tracking-wider text-muted/80">
                      Quick Navigation ({searchResults.modules.length})
                    </div>
                    {searchResults.modules.map((item, idx) =>
                      renderItem(item, searchResults.employees.length + searchResults.tasks.length + idx)
                    )}
                  </div>
                )}

                {searchResults.leaves.length > 0 && (
                  <div className="flex flex-col gap-1 border-t border-line/40 pt-1.5">
                    <div className="px-2 pt-1 text-[10px] font-bold uppercase tracking-wider text-muted/80">
                      Leave & Holidays ({searchResults.leaves.length})
                    </div>
                    {searchResults.leaves.map((item, idx) =>
                      renderItem(
                        item,
                        searchResults.employees.length + searchResults.tasks.length + searchResults.modules.length + idx
                      )
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* ================= COLLAPSED ICON TRIGGER (< 1024px) ================= */}
      <div className="flex lg:hidden shrink-0">
        <button
          type="button"
          onClick={() => setIsMobileSearchOpen(true)}
          className="w-[44px] h-[44px] rounded-full bg-surface2 border border-line text-muted hover:text-ink hover:border-accent flex items-center justify-center transition cursor-pointer shrink-0"
          aria-label="Open search dialog"
          title="Search employees, tasks, leave..."
        >
          <Icon name="search" className="w-4 h-4 text-muted" />
        </button>
      </div>

      {/* Fullscreen Search Overlay */}
      {isMobileSearchOpen && renderOverlay()}
    </>
  );
};
