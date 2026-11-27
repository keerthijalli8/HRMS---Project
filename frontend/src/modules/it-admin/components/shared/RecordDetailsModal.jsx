import React, { useEffect, useMemo, useState } from 'react';
import { Drawer } from './Drawer';
import { Button } from './Button';
import { IconDownload } from './Icons';

function displayValue(value) {
  if (value === null || value === undefined || value === '') return 'Not recorded';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.length ? value.join(', ') : 'None';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

function safeFilename(value) {
  return String(value || 'record')
    .replace(/[^a-z0-9-]+/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

export function RecordDetailsModal({
  isOpen,
  onClose,
  title,
  record,
  fields,
  canEdit = false,
  onSave,
  canExport = false,
  exportData,
  exportFilename,
  headerActions,
  children
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState({});
  const editableFields = useMemo(() => fields.filter((field) => field.editable && field.key), [fields]);

  useEffect(() => {
    setIsEditing(false);
    setDraft({});
  }, [isOpen, record]);

  const startEditing = () => {
    setDraft(Object.fromEntries(editableFields.map((field) => [
      field.key,
      field.value === null || field.value === undefined ? '' : String(field.value)
    ])));
    setIsEditing(true);
  };

  const saveChanges = () => {
    if (!canEdit || !onSave) return;
    const updates = Object.fromEntries(editableFields.map((field) => [
      field.key,
      field.type === 'number' && String(draft[field.key] || '').trim() !== ''
        ? Number(draft[field.key])
        : draft[field.key]
    ]));
    if (onSave(updates) === false) return;
    setIsEditing(false);
  };

  const exportRecord = () => {
    if (!canExport) return;
    const payload = {
      exportedAt: new Date().toISOString(),
      record: exportData === undefined ? record : exportData
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = exportFilename || `${safeFilename(title)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      isCentered
      isFullScreen
      title={title}
      closeButtonLabel="Close record details"
      headerActions={
        <div className="flex items-center gap-2">
          {canEdit && onSave && editableFields.length > 0 && !isEditing && (
            <Button variant="secondary" onClick={startEditing}>Edit Record</Button>
          )}
          {canExport && (
            <Button
              variant="primary"
              icon={IconDownload}
              ariaLabel={`Export ${title}`}
              disabled={isEditing}
              onClick={exportRecord}
            >
              Export Record
            </Button>
          )}
          {headerActions}
        </div>
      }
      footer={isEditing ? (
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button>
          <Button variant="primary" onClick={saveChanges}>Save Changes</Button>
        </div>
      ) : (
        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      )}
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {fields.map((field) => (
            <div key={field.key || field.label} className="min-w-0 p-3 rounded-xl bg-surface2/40 border border-line">
              <span className="block text-[11px] uppercase tracking-wide text-muted">{field.label}</span>
              {isEditing && field.editable && field.key ? (
                field.type === 'select' ? (
                  <select
                    aria-label={field.label}
                    value={draft[field.key] ?? ''}
                    onChange={(event) => setDraft((current) => ({ ...current, [field.key]: event.target.value }))}
                    className="w-full mt-1 px-2.5 py-2 rounded-lg bg-surface border border-line text-ink"
                  >
                    {field.options?.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea
                    aria-label={field.label}
                    rows={3}
                    value={draft[field.key] ?? ''}
                    onChange={(event) => setDraft((current) => ({ ...current, [field.key]: event.target.value }))}
                    className="w-full mt-1 px-2.5 py-2 rounded-lg bg-surface border border-line text-ink"
                  />
                ) : (
                  <input
                    aria-label={field.label}
                    type={field.type || 'text'}
                    min={field.type === 'number' ? '0' : undefined}
                    value={draft[field.key] ?? ''}
                    onChange={(event) => setDraft((current) => ({ ...current, [field.key]: event.target.value }))}
                    className="w-full mt-1 px-2.5 py-2 rounded-lg bg-surface border border-line text-ink"
                  />
                )
              ) : (
                <span className="block mt-1 text-[13px] font-semibold text-ink break-words whitespace-pre-wrap">
                  {displayValue(field.value)}
                </span>
              )}
            </div>
          ))}
        </div>
        {isEditing && (
          <p className="text-[11px] text-muted">
            Only fields explicitly marked editable for this module can be changed here.
          </p>
        )}
        {children}
      </div>
    </Drawer>
  );
}
