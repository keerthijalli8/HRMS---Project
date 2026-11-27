import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Icon } from './Icon.jsx';
import {
  BENEFIT_GROUPS,
  ALL_BENEFIT_ITEMS,
  getSavedBenefitsSelection,
  saveBenefitsSelection,
  subscribeBenefits,
  isUserHrOrAdmin
} from '../services/benefitsService.js';
import { getCompanyById } from '../data/companyStore.js';

export const BenefitsSelector = ({ currentUser, onTriggerToast }) => {
  const companyId = currentUser?.companyId || "NEX-IND";
  const company = getCompanyById(companyId);
  const isHr = isUserHrOrAdmin(currentUser);

  // Active saved selection from shared service
  const [savedSelection, setSavedSelection] = useState(() => getSavedBenefitsSelection(companyId));

  // Subscribe to changes across modules
  useEffect(() => {
    const unsub = subscribeBenefits((newSelection) => {
      setSavedSelection([...newSelection]);
    });
    return unsub;
  }, [companyId]);

  // Draft state while editing inside dropdown
  const [draftSelection, setDraftSelection] = useState(() => [...savedSelection]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeItemIndex, setActiveItemIndex] = useState(0);

  // Keep draft in sync when closed
  useEffect(() => {
    if (!isOpen) {
      setDraftSelection([...savedSelection]);
      setSearchQuery("");
      setActiveItemIndex(0);
    }
  }, [savedSelection, isOpen]);

  const containerRef = useRef(null);
  const comboboxRef = useRef(null);
  const listboxRef = useRef(null);
  const searchInputRef = useRef(null);

  // Check if draft has unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    if (draftSelection.length !== savedSelection.length) return true;
    const draftSet = new Set(draftSelection);
    return savedSelection.some(k => !draftSet.has(k));
  }, [draftSelection, savedSelection]);

  // Filtered items based on search input
  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return BENEFIT_GROUPS;

    return BENEFIT_GROUPS.map(groupObj => {
      const matchingItems = groupObj.items.filter(item => 
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.calcType.toLowerCase().includes(q) ||
        groupObj.group.toLowerCase().includes(q)
      );
      return {
        ...groupObj,
        items: matchingItems
      };
    }).filter(groupObj => groupObj.items.length > 0);
  }, [searchQuery]);

  const flatFilteredItems = useMemo(() => {
    return filteredGroups.flatMap(g => g.items);
  }, [filteredGroups]);

  // Handle open / toggle
  const handleComboboxToggle = () => {
    if (!isHr) return;
    if (isOpen) {
      setDraftSelection([...savedSelection]);
      setIsOpen(false);
    } else {
      setDraftSelection([...savedSelection]);
      setIsOpen(true);
      setActiveItemIndex(0);
      setTimeout(() => {
        searchInputRef.current?.focus({ preventScroll: true });
      }, 50);
    }
  };

  // Discard draft on cancel
  const handleCancel = () => {
    setDraftSelection([...savedSelection]);
    setIsOpen(false);
    comboboxRef.current?.focus({ preventScroll: true });
  };

  // Save changes on Done
  const handleDone = () => {
    if (!isHr) return;
    try {
      saveBenefitsSelection(draftSelection, companyId, currentUser);
      setIsOpen(false);
      onTriggerToast?.("Benefits & allowances updated successfully.");
      comboboxRef.current?.focus({ preventScroll: true });
    } catch (err) {
      console.error(err);
      onTriggerToast?.(err.message || "Failed to update benefits.");
    }
  };

  // Select All action (Basic Salary remains locked)
  const handleSelectAll = () => {
    if (!isHr) return;
    const allKeys = ALL_BENEFIT_ITEMS.map(i => i.key);
    setDraftSelection(allKeys);
  };

  // Clear All action (Basic Salary stays locked & selected)
  const handleClearAll = () => {
    if (!isHr) return;
    setDraftSelection(["basic_salary"]);
  };

  // Toggle single item in draft
  const handleToggleItem = (key) => {
    if (!isHr) return;
    if (key === "basic_salary") return; // locked

    setDraftSelection(prev => {
      if (prev.includes(key)) {
        return prev.filter(k => k !== key);
      } else {
        return [...prev, key];
      }
    });
  };

  // Remove single chip directly from saved selection
  const handleRemoveChip = (key) => {
    if (!isHr || key === "basic_salary") return;
    const updated = savedSelection.filter(k => k !== key);
    saveBenefitsSelection(updated, companyId, currentUser);
    const item = ALL_BENEFIT_ITEMS.find(i => i.key === key);
    onTriggerToast?.(`Removed ${item?.name || key} from active benefits.`);
  };

  // Keyboard navigation inside list
  const handleKeyDown = (e) => {
    if (!isHr) return;

    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleComboboxToggle();
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (flatFilteredItems.length > 0) {
        setActiveItemIndex(prev => (prev + 1) % flatFilteredItems.length);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (flatFilteredItems.length > 0) {
        setActiveItemIndex(prev => (prev - 1 + flatFilteredItems.length) % flatFilteredItems.length);
      }
    } else if (e.key === "Enter" || e.key === " ") {
      if (e.target === searchInputRef.current && e.key === " ") {
        return;
      }
      e.preventDefault();
      const currentItem = flatFilteredItems[activeItemIndex];
      if (currentItem && currentItem.key !== "basic_salary") {
        handleToggleItem(currentItem.key);
      }
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (isOpen && listboxRef.current) {
      const activeEl = listboxRef.current.querySelector(`[data-item-index="${activeItemIndex}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [activeItemIndex, isOpen]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setDraftSelection([...savedSelection]);
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, savedSelection]);

  // Selected items objects for chips & summary table
  const selectedObjects = useMemo(() => {
    return ALL_BENEFIT_ITEMS.filter(item => savedSelection.includes(item.key));
  }, [savedSelection]);

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* 1. Main Dropdown Control Section */}
      <div className="glass-card !p-5 border border-line flex flex-col gap-4 relative z-30" ref={containerRef}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line/60 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <label id="benefits-select-label" className="text-base font-display font-bold text-ink">
                Configure Benefits & Allowances
              </label>
              <span className="glass-pill px-2.5 py-0.5 text-xs text-accent font-data font-semibold">
                {savedSelection.length} Active
              </span>
            </div>
            <p className="text-xs text-muted mt-0.5">
              Select compensation elements, allowances, perks, and statutory deductions provided to employees of <span className="text-ink font-semibold">{company?.name || "the company"}</span>.
            </p>
          </div>

          {!isHr && (
            <span className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full font-medium self-start sm:self-auto flex items-center gap-1.5">
              <Icon name="lock" className="w-3.5 h-3.5" />
              Read-only view (HR Admin required to modify)
            </span>
          )}
        </div>

        {/* Dropdown Combobox Trigger */}
        <div className="relative w-full max-w-xl">
          <button
            ref={comboboxRef}
            type="button"
            role="combobox"
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-labelledby="benefits-select-label"
            aria-controls="benefits-dropdown-list"
            disabled={!isHr}
            onClick={handleComboboxToggle}
            onKeyDown={handleKeyDown}
            className={`group h-[48px] w-full rounded-xl border bg-surface2/60 px-4 flex flex-row items-center justify-between text-left transition select-none ${
              !isHr
                ? 'opacity-80 cursor-default border-line bg-surface2/30'
                : isOpen
                ? 'border-accent ring-2 ring-accent/30 shadow-lg'
                : 'border-line hover:border-accent shadow-sm'
            } focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30`}
          >
            <div className="flex items-center gap-2.5 truncate">
              <Icon name="shield" className={`w-4 h-4 ${isOpen ? 'text-accent' : 'text-muted group-hover:text-accent'}`} />
              <span className="text-sm font-medium text-ink">
                Select Benefits & Allowances ({isHr && isOpen ? draftSelection.length : savedSelection.length} selected)
              </span>
            </div>

            <div className="flex items-center gap-3">
              {isHr && hasUnsavedChanges && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-amber-400 font-medium bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Unsaved
                </span>
              )}
              <span className="w-px h-6 bg-line" aria-hidden="true" />
              <span
                className={`transition-transform duration-200 flex items-center justify-center ${
                  !isHr ? 'text-muted' : isOpen ? 'rotate-180 text-accent' : 'text-muted group-hover:text-accent'
                }`}
              >
                <Icon name="chevron-down" className="w-4 h-4" />
              </span>
            </div>
          </button>

          {/* Dropdown Floating Layer */}
          {isOpen && isHr && (
            <div
              id="benefits-dropdown-list"
              role="listbox"
              aria-multiselectable="true"
              aria-labelledby="benefits-select-label"
              className="absolute left-0 top-full mt-2 w-full z-50 rounded-xl border border-line bg-[#071b26] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="p-3 border-b border-line bg-[#071b26] flex flex-col gap-2">
                <div className="relative w-full">
                  <Icon name="search" className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setActiveItemIndex(0);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Search allowances, deductions, perks..."
                    className="w-full h-9 pl-9 pr-8 rounded-lg bg-surface2/60 border border-line text-xs text-ink placeholder:text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink text-xs p-1"
                    >
                      <Icon name="x" className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-[11.5px] font-medium text-accent hover:underline flex items-center gap-1"
                    >
                      <Icon name="check-square" className="w-3 h-3" />
                      Select all
                    </button>
                    <span className="text-line">•</span>
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="text-[11.5px] font-medium text-muted hover:text-ink hover:underline flex items-center gap-1"
                    >
                      <Icon name="square" className="w-3 h-3" />
                      Clear all (except Basic)
                    </button>
                  </div>

                  <span className="text-[11px] text-muted font-num">
                    {flatFilteredItems.length} components shown
                  </span>
                </div>
              </div>

              <div ref={listboxRef} className="max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-line">
                {filteredGroups.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted">
                    <Icon name="search" className="w-6 h-6 mx-auto mb-2 text-muted/60" />
                    No components match "{searchQuery}"
                  </div>
                ) : (
                  filteredGroups.map(groupObj => (
                    <div key={groupObj.group}>
                      <div className="sticky top-0 z-10 bg-[#071b26]/95 backdrop-blur-sm px-4 py-2 border-b border-line/60 text-[10.5px] font-bold uppercase tracking-wider text-muted select-none flex items-center justify-between">
                        <span>{groupObj.group}</span>
                        <span className="text-[10px] text-muted/70 font-num">
                          {groupObj.items.filter(i => draftSelection.includes(i.key)).length}/{groupObj.items.length}
                        </span>
                      </div>

                      {groupObj.items.map(item => {
                        const currentIndex = flatFilteredItems.findIndex(i => i.key === item.key);
                        const isSelected = draftSelection.includes(item.key);
                        const isKeyboardActive = activeItemIndex === currentIndex;

                        return (
                          <div
                            key={item.key}
                            role="option"
                            aria-selected={isSelected}
                            data-item-index={currentIndex}
                            onClick={() => handleToggleItem(item.key)}
                            onMouseEnter={() => setActiveItemIndex(currentIndex)}
                            className={`h-[44px] px-4 flex flex-row items-center gap-3 cursor-pointer text-sm transition-colors select-none ${
                              isSelected
                                ? 'bg-accent/15 border-l-[3px] border-l-accent text-ink font-medium'
                                : 'border-l-[3px] border-l-transparent text-muted hover:text-ink hover:bg-white/5'
                            } ${isKeyboardActive ? 'bg-white/10 ring-1 ring-inset ring-accent/60' : ''}`}
                          >
                            <div
                              className={`w-[18px] h-[18px] rounded-[4px] border flex items-center justify-center flex-shrink-0 transition-colors ${
                                isSelected
                                  ? 'bg-accent border-accent text-[#04131d]'
                                  : 'border-line bg-transparent text-transparent'
                              }`}
                            >
                              {isSelected && (
                                item.locked ? (
                                  <Icon name="lock" className="w-3 h-3 text-[#04131d]" />
                                ) : (
                                  <Icon name="check" className="w-3.5 h-3.5 stroke-[2.5]" />
                                )
                              )}
                            </div>

                            <div className="flex-1 flex items-center justify-between gap-2 truncate">
                              <span className={`text-xs truncate ${isSelected ? 'text-ink font-medium' : 'text-ink/80'}`}>
                                {item.name}
                                {item.locked && (
                                  <span className="ml-1.5 text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.2 rounded border border-amber-400/20 font-normal">
                                    Locked Base
                                  </span>
                                )}
                              </span>
                              <span className="text-[11px] text-muted truncate">
                                {item.calcType}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>

              <div className="sticky bottom-0 z-20 bg-[#071b26] border-t border-line px-4 py-3 flex flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-ink font-medium font-num">
                    {draftSelection.length} selected
                  </span>
                  {hasUnsavedChanges && (
                    <span className="text-[11px] text-amber-400 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      Unsaved changes
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-line bg-surface2/60 text-muted hover:text-ink hover:border-muted transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDone}
                    className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-accent text-on-accent hover:brightness-110 active:scale-95 transition cursor-pointer shadow-md"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Selected Items Chips Row */}
      <div className="glass-card !p-4 border border-line flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-line/60 pb-2.5">
          <div className="flex items-center gap-2">
            <Icon name="check-circle" className="w-4 h-4 text-good" />
            <h3 className="font-display font-bold text-ink text-sm">
              Active Compensation Components
            </h3>
            <span className="text-xs text-muted font-num">({selectedObjects.length} active)</span>
          </div>
          {isHr && (
            <span className="text-[11px] text-muted italic">Click ✕ to remove any non-locked component</span>
          )}
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {selectedObjects.map(item => {
            const isEarning = item.category === "Earning";
            const isDeduction = item.category === "Deduction";

            return (
              <div
                key={item.key}
                className="group inline-flex items-center gap-1.5 pl-3 pr-2 py-1 rounded-full bg-surface2/80 border border-line text-xs text-ink hover:border-accent/40 transition-all shadow-sm"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isEarning ? 'bg-accent' : isDeduction ? 'bg-bad' : 'bg-accent2'}`} />
                <span className="font-medium">{item.name}</span>

                {item.locked ? (
                  <span title="Basic Salary is locked and mandatory" className="text-muted ml-0.5">
                    <Icon name="lock" className="w-3 h-3 text-amber-400" />
                  </span>
                ) : isHr ? (
                  <button
                    type="button"
                    title={`Remove ${item.name}`}
                    onClick={() => handleRemoveChip(item.key)}
                    className="w-4 h-4 rounded-full flex items-center justify-center text-muted hover:text-bad hover:bg-bad/20 transition cursor-pointer ml-0.5"
                  >
                    <Icon name="x" className="w-3 h-3 stroke-[2.5]" />
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Summary Table (Clean Text formatting without background boxes for Type & Taxable) */}
      <div className="glass-card !p-0 overflow-hidden border border-line">
        <div className="p-4 border-b border-line flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-display font-bold text-ink text-base">
              Salary Component & Allowances Breakdown
            </h3>
            <p className="text-xs text-muted">
              Rules, calculation basis, taxability, and payroll mapping
            </p>
          </div>
          <span className="glass-pill px-3 py-1 text-xs text-ink font-semibold self-start sm:self-auto font-num">
            {selectedObjects.length} Configured Items
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface2/60 border-b border-line text-muted uppercase text-[10.5px] font-semibold tracking-wider">
              <tr>
                <th className="py-3 px-4">Component</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Calculation Rule</th>
                <th className="py-3 px-4">Frequency</th>
                <th className="py-3 px-4">Taxable</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dashed divide-line">
              {selectedObjects.map(item => (
                <tr key={item.key} className="hover:bg-surface2/40 transition-colors">
                  {/* Component Name */}
                  <td className="py-3 px-4">
                    <div className="font-semibold text-ink flex items-center gap-1.5">
                      {item.name}
                      {item.locked && (
                        <span className="text-[10px] text-amber-400 font-normal">
                          (Mandatory Base)
                        </span>
                      )}
                    </div>
                    <span className="text-[10.5px] text-muted font-mono">{item.key}</span>
                  </td>

                  {/* Type / Category (Clean Text, No Box) */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="text-xs font-medium text-ink">
                      {item.category}
                    </span>
                  </td>

                  {/* Calculation Basis */}
                  <td className="py-3 px-4 font-data text-ink">
                    {item.calcType}
                  </td>

                  {/* Frequency */}
                  <td className="py-3 px-4 text-muted capitalize">
                    {item.frequency || "Monthly"}
                  </td>

                  {/* Taxable / Exempt (Clean Text, No Box) */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={`text-xs font-medium ${item.taxable ? "text-ink" : "text-muted"}`}>
                      {item.taxable ? "Taxable" : "Exempt"}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4 text-right">
                    <span className="inline-flex items-center gap-1.5 text-good font-semibold text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-good animate-pulse" />
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BenefitsSelector;