import React, { useMemo, useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { ROLE_MODULES } from '../../data/roleProfiles';
import { Button } from '../shared/Button';
import { Card } from '../shared/Card';
import { RecordDetailsModal } from '../shared/RecordDetailsModal';
import { IconKey, IconPlus, IconShield } from '../shared/Icons';

const ACTIONS = ['read', 'write', 'update', 'delete'];

const createEmptyPermissions = () =>
  Object.fromEntries(
    ROLE_MODULES.map((module) => [
      module,
      Object.fromEntries(ACTIONS.map((action) => [action, false]))
    ])
  );

export function RolePermissionsDashboard() {
  const { roleProfiles, createRoleProfile, updateRoleProfiles, users, updateUser, showToast, hasPermission } = useStore();
  const canReadRoles = hasPermission('Role Administration', 'read');
  const canCreateRoles = hasPermission('Role Administration', 'write');
  const canUpdateRoles = hasPermission('Role Administration', 'update');
  const canExportRoles = hasPermission('Reports', 'read');
  const [selectedRoleId, setSelectedRoleId] = useState(roleProfiles[0]?.id || '');
  const [selectedRoleModule, setSelectedRoleModule] = useState(null);
  const [selectedAssignmentUser, setSelectedAssignmentUser] = useState(null);
  const [newRoleName, setNewRoleName] = useState('');
  const [search, setSearch] = useState('');

  const selectedRole = roleProfiles.find((role) => role.id === selectedRoleId) || roleProfiles[0];
  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) =>
      [user.name, user.email, user.employeeId, user.department]
        .some((value) => String(value || '').toLowerCase().includes(query))
    );
  }, [users, search]);

  const createRole = (event) => {
    event.preventDefault();
    if (!hasPermission('Role Administration', 'write')) return;
    const name = newRoleName.trim();
    if (!name) return;
    if (roleProfiles.some((role) => role.name.toLowerCase() === name.toLowerCase())) {
      showToast(`Role "${name}" already exists.`);
      return;
    }

    const nextId = roleProfiles.reduce((highest, role) => {
      const number = Number(role.id.replace('ROLE-', ''));
      return Number.isFinite(number) ? Math.max(highest, number) : highest;
    }, 0) + 1;
    const role = {
      id: `ROLE-${String(nextId).padStart(3, '0')}`,
      name,
      tier: 'Custom',
      permissions: createEmptyPermissions()
    };
    if (!createRoleProfile(role)) return;
    setSelectedRoleId(role.id);
    setNewRoleName('');
    showToast(`Created role "${name}"`);
  };

  const updatePermission = (module, action) => {
    if (!selectedRole || !hasPermission('Role Administration', 'update')) return;
    updateRoleProfiles((previous) => previous.map((role) => {
      if (role.id !== selectedRole.id) return role;
      return {
        ...role,
        permissions: {
          ...role.permissions,
          [module]: {
            ...role.permissions[module],
            [action]: !role.permissions[module]?.[action]
          }
        }
      };
    }));
  };

  const permissionCount = (role) => ROLE_MODULES.reduce(
    (count, module) => count + ACTIONS.filter((action) => role.permissions[module]?.[action]).length,
    0
  );

  if (!canReadRoles) {
    return (
      <div className="rounded-xl border border-line bg-surface p-6 text-center">
        <h2 className="font-display font-bold text-[18px] text-ink">Role Administration Restricted</h2>
        <p className="mt-1 text-[13px] text-muted">Your active role does not have Role Administration: read permission.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 w-full min-w-0 animate-in fade-in-50 duration-150">
      <header className="flex items-center gap-3">
        <IconKey className="w-6 h-6 text-sky-400" />
        <div>
          <h1 className="font-display font-bold text-[22px] text-ink tracking-tight">Role & Permissions Dashboard</h1>
          <p className="text-[13px] text-muted">Manage administrative tiers, module-level privileges, and user role assignments.</p>
        </div>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-[var(--radius)] bg-surface border border-line">
          <span className="text-[10px] uppercase tracking-wider text-muted font-bold">Defined Roles</span>
          <p className="font-display font-bold text-[26px] text-ink mt-1">{roleProfiles.length}</p>
        </div>
        <div className="p-3.5 rounded-[var(--radius)] bg-surface border border-line">
          <span className="text-[10px] uppercase tracking-wider text-muted font-bold">Permission Modules</span>
          <p className="font-display font-bold text-[26px] text-ink mt-1">{ROLE_MODULES.length}</p>
        </div>
        <div className="p-3.5 rounded-[var(--radius)] bg-surface border border-line">
          <span className="text-[10px] uppercase tracking-wider text-muted font-bold">Users with Roles</span>
          <p className="font-display font-bold text-[26px] text-ink mt-1">{users.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(230px,0.75fr)_minmax(0,2fr)] gap-4">
        <Card title="Role Hierarchy" subText="Role ID, name, tier, and current assignment count">
          <div className="flex flex-col gap-2">
            {roleProfiles.map((role) => (
              <button
                type="button"
                key={role.id}
                onClick={() => setSelectedRoleId(role.id)}
                aria-pressed={selectedRoleId === role.id}
                className={`p-3 rounded-lg border text-left transition-colors ${selectedRoleId === role.id ? 'bg-accent/10 border-accent' : 'bg-surface2/40 border-line hover:border-accent/60'}`}
              >
                <span className="text-[11px] text-muted font-data">{role.id} · {role.tier}</span>
                <span className="mt-0.5 flex items-center justify-between gap-2 font-semibold text-ink">
                  {role.name}
                  <span className="text-[10px] text-muted font-normal">{users.filter((user) => (user.adminRoleId || 'ROLE-006') === role.id).length} users</span>
                </span>
              </button>
            ))}
          </div>
          {canCreateRoles && <form onSubmit={createRole} className="flex flex-col gap-2 pt-3 border-t border-line">
            <label htmlFor="create-role-name" className="text-[12px] font-semibold text-ink">Create role</label>
            <input
              id="create-role-name"
              value={newRoleName}
              onChange={(event) => setNewRoleName(event.target.value)}
              placeholder="Custom role name"
              className="w-full px-3 py-2 text-[13px] rounded-[var(--radius)] bg-surface2 border border-line text-ink focus:outline-none focus:border-accent"
            />
            <Button type="submit" icon={IconPlus}>Create Role</Button>
          </form>}
        </Card>

        <Card
          title={selectedRole ? `${selectedRole.name} · ${selectedRole.id}` : 'Select a role'}
          subText={selectedRole ? `${permissionCount(selectedRole)} privileges enabled. Select permissions to update this role.` : ''}
        >
          {selectedRole && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-[12px]">
                <thead>
                  <tr className="border-b border-line text-[10px] uppercase tracking-wider text-muted">
                    <th scope="col" className="py-2.5">Module</th>
                    {ACTIONS.map((action) => <th key={action} scope="col" className="py-2.5 text-center">{action}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-dashed divide-line">
                  {ROLE_MODULES.map((module) => (
                    <tr
                      key={module}
                      tabIndex={0}
                      aria-label={`View ${module} permissions for ${selectedRole.name}`}
                      onClick={() => setSelectedRoleModule(module)}
                      onKeyDown={(event) => {
                        if (event.target !== event.currentTarget) return;
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setSelectedRoleModule(module);
                        }
                      }}
                      className="cursor-pointer hover:bg-surface2/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                    >
                      <th scope="row" className="py-2.5 font-medium text-ink">{module}</th>
                      {ACTIONS.map((action) => (
                        <td key={action} className="py-2.5 text-center">
                          <input
                            type="checkbox"
                            aria-label={`${action} permission for ${module} on ${selectedRole.name}`}
                            checked={Boolean(selectedRole.permissions[module]?.[action])}
                            disabled={!canUpdateRoles}
                            onClick={(event) => event.stopPropagation()}
                            onChange={() => updatePermission(module, action)}
                            className="w-4 h-4 accent-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <Card title="Assign Roles to Users" subText="Role assignments update each user's profile and are reflected in User Management.">
        <div className="max-w-sm mb-3">
          <input
            type="search"
            aria-label="Search users for role assignment"
            placeholder="Search users by name, ID, email, or department"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full px-3 py-2 text-[13px] rounded-[var(--radius)] bg-surface2 border border-line text-ink focus:outline-none focus:border-accent"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-[12px]">
            <thead>
              <tr className="border-b border-line text-[10px] uppercase tracking-wider text-muted">
                <th scope="col" className="py-2.5">Employee</th>
                <th scope="col" className="py-2.5">Employee ID</th>
                <th scope="col" className="py-2.5">Department</th>
                <th scope="col" className="py-2.5">Assigned Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dashed divide-line">
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  tabIndex={0}
                  aria-label={`View role assignment for ${user.name}`}
                  onClick={() => setSelectedAssignmentUser(user)}
                  onKeyDown={(event) => {
                    if (event.target !== event.currentTarget) return;
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedAssignmentUser(user);
                    }
                  }}
                  className="cursor-pointer hover:bg-surface2/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                >
                  <td className="py-2.5 text-ink"><span className="inline-flex items-center gap-2"><IconShield className="w-3.5 h-3.5 text-accent" />{user.name}</span></td>
                  <td className="py-2.5 text-muted font-data">{user.employeeId || '—'}</td>
                  <td className="py-2.5 text-muted">{user.department}</td>
                  <td className="py-2.5">
                    <select
                      aria-label={`Assign role to ${user.name}`}
                      value={user.adminRoleId || 'ROLE-006'}
                      disabled={!canUpdateRoles}
                      onClick={(event) => event.stopPropagation()}
                      onChange={(event) => updateUser(user.id, { adminRoleId: event.target.value })}
                      className="px-2.5 py-1.5 rounded bg-surface2 border border-line text-ink disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {roleProfiles.map((role) => <option key={role.id} value={role.id}>{role.name} · {role.id}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && <tr><td colSpan="4" className="py-6 text-center text-muted">No matching users.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      {selectedRoleModule && selectedRole && (
        <RecordDetailsModal
          isOpen={true}
          onClose={() => setSelectedRoleModule(null)}
          title={`${selectedRoleModule} Permissions · ${selectedRole.name}`}
          record={{ roleId: selectedRole.id, roleName: selectedRole.name, module: selectedRoleModule }}
          fields={[
            { label: 'Role', value: selectedRole.name },
            { label: 'Role ID', value: selectedRole.id },
            { label: 'Permission Module', value: selectedRoleModule },
            ...ACTIONS.map((action) => ({
              label: `${action[0].toUpperCase()}${action.slice(1)} Permission`,
              key: `permission_${action}`,
              value: Boolean(selectedRole.permissions[selectedRoleModule]?.[action]),
              type: 'select',
              editable: true,
              options: [{ value: 'true', label: 'Enabled' }, { value: 'false', label: 'Disabled' }]
            }))
          ]}
          canEdit={canUpdateRoles}
          onSave={(updates) => {
            if (!hasPermission('Role Administration', 'update')) return false;
            return updateRoleProfiles((previous) => previous.map((role) => (
              role.id === selectedRole.id
                ? {
                  ...role,
                  permissions: {
                    ...role.permissions,
                    [selectedRoleModule]: Object.fromEntries(ACTIONS.map((action) => [
                      action,
                      updates[`permission_${action}`] === 'true'
                    ]))
                  }
                }
                : role
            )));
          }}
          canExport={canExportRoles}
          exportData={{
            roleId: selectedRole.id,
            roleName: selectedRole.name,
            module: selectedRoleModule,
            permissions: selectedRole.permissions[selectedRoleModule]
          }}
          exportFilename={`role-${selectedRole.id}-${selectedRoleModule.toLowerCase().replace(/\s+/g, '-')}.json`}
        />
      )}

      {selectedAssignmentUser && (
        <RecordDetailsModal
          isOpen={true}
          onClose={() => setSelectedAssignmentUser(null)}
          title={`Role Assignment · ${selectedAssignmentUser.name}`}
          record={selectedAssignmentUser}
          fields={[
            { label: 'Employee', value: selectedAssignmentUser.name },
            { label: 'Employee ID', value: selectedAssignmentUser.employeeId },
            { label: 'Department', value: selectedAssignmentUser.department },
            { label: 'Assigned Role', key: 'adminRoleId', value: selectedAssignmentUser.adminRoleId || 'ROLE-006', type: 'select', editable: true, options: roleProfiles.map((role) => ({ value: role.id, label: `${role.name} · ${role.id}` })) }
          ]}
          canEdit={canUpdateRoles}
          onSave={(updates) => {
            if (!hasPermission('Role Administration', 'update')) return false;
            const success = updateUser(selectedAssignmentUser.id, { adminRoleId: updates.adminRoleId });
            if (success === false) return false;
            setSelectedAssignmentUser((current) => ({ ...current, adminRoleId: updates.adminRoleId }));
          }}
          canExport={canExportRoles}
          exportData={{
            id: selectedAssignmentUser.id,
            employeeId: selectedAssignmentUser.employeeId,
            name: selectedAssignmentUser.name,
            department: selectedAssignmentUser.department,
            adminRoleId: selectedAssignmentUser.adminRoleId || 'ROLE-006',
            adminRoleName: roleProfiles.find((role) => role.id === (selectedAssignmentUser.adminRoleId || 'ROLE-006'))?.name
          }}
          exportFilename={`user-role-${selectedAssignmentUser.employeeId || selectedAssignmentUser.id}.json`}
        />
      )}
    </div>
  );
}
