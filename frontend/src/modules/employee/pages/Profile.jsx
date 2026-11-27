// src/pages/Profile.jsx
// Employee profile: interactive header, editable personal data, locked work details, emergency contacts, and activity logs.

import React, { useState, useRef } from 'react';
import {
  User,
  Briefcase,
  Phone,
  Activity as ActivityIcon,
  Camera,
  Lock,
  Save,
  Undo,
  MapPin,
  Calendar,
  ShieldCheck,
  Plus,
  Upload,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../../auth/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { authService } from '../services/authService.js';
import { Card } from '../components/Card.jsx';
import { PrimaryButton, SecondaryButton } from '../components/Buttons.jsx';
import { StatusPill } from '../components/StatusPill.jsx';
import { Tag } from '../components/Tag.jsx';
import { Progress } from '../components/Progress.jsx';
import { Avatar } from '../components/Avatar.jsx';
import { Drawer } from '../components/Drawer.jsx';
import { Table } from '../components/Table.jsx';
import { INITIAL_EMPLOYEE } from '../data/employee.js';
import { formatDate } from '../utils/format.js';

export function Profile() {
  const { user, updateAvatar, updateProfile } = useAuth();
  const { showToast } = useToast();

  const initialStored = authService.getStoredProfile();
  const [activeTab, setActiveTab] = useState('personal'); // personal, work, emergency, activity
  const [profile, setProfile] = useState(initialStored);
  const [formData, setFormData] = useState({
    name: initialStored.name,
    preferredName: initialStored.preferredName,
    mobile: initialStored.mobile,
    personalEmail: initialStored.personalEmail,
    gender: initialStored.gender,
    bloodGroup: initialStored.bloodGroup,
    maritalStatus: initialStored.maritalStatus,
    currentAddress: initialStored.currentAddress,
    permanentAddress: initialStored.permanentAddress,
    city: initialStored.city,
    state: initialStored.state,
    pincode: initialStored.pincode,
    sameAsCurrent: initialStored.currentAddress === initialStored.permanentAddress
  });

  const [isDirty, setIsDirty] = useState(false);
  const [isSavingPersonal, setIsSavingPersonal] = useState(false);
  const hasEditedPreferredRef = useRef(false);
  const [photoDrawerOpen, setPhotoDrawerOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFileName, setPhotoFileName] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [photoDragActive, setPhotoDragActive] = useState(false);
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);
  const photoInputRef = useRef(null);

  const [workChangeDrawerOpen, setWorkChangeDrawerOpen] = useState(false);
  const [workChangeField, setWorkChangeField] = useState('Designation');
  const [workChangeReason, setWorkChangeReason] = useState('');

  const handleInputChange = (field, value) => {
    setIsDirty(true);
    if (field === 'preferredName') {
      hasEditedPreferredRef.current = true;
    }
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'name' && !hasEditedPreferredRef.current) {
        const newFirst = (value || '').trim().split(/\s+/)[0] || '';
        updated.preferredName = newFirst;
      }
      if (field === 'sameAsCurrent' && value) {
        updated.permanentAddress = updated.currentAddress;
      }
      return updated;
    });
  };

  const handleSavePersonal = async (e) => {
    e.preventDefault();
    const trimmedName = (formData.name || '').trim();
    const trimmedPreferred = (formData.preferredName || '').trim() || trimmedName.split(/\s+/)[0];
    if (!trimmedName) {
      showToast('Full name is required.', 'error');
      return;
    }

    const nextForm = {
      ...formData,
      name: trimmedName,
      preferredName: trimmedPreferred
    };

    setIsSavingPersonal(true);
    try {
      setFormData(nextForm);
      setProfile(prev => ({ ...prev, ...nextForm }));
      await updateProfile(nextForm);
      hasEditedPreferredRef.current = false;
      setIsDirty(false);
      showToast('Personal profile saved and updated across all dashboards.');
    } finally {
      setIsSavingPersonal(false);
    }
  };

  const handleDiscard = () => {
    setFormData({
      name: profile.name,
      preferredName: profile.preferredName,
      mobile: profile.mobile,
      personalEmail: profile.personalEmail,
      gender: profile.gender,
      bloodGroup: profile.bloodGroup,
      maritalStatus: profile.maritalStatus,
      currentAddress: profile.currentAddress,
      permanentAddress: profile.permanentAddress,
      city: profile.city,
      state: profile.state,
      pincode: profile.pincode,
      sameAsCurrent: profile.currentAddress === profile.permanentAddress
    });
    hasEditedPreferredRef.current = false;
    setIsDirty(false);
    showToast('Changes discarded.');
  };

  const handleWorkChangeSubmit = (e) => {
    e.preventDefault();
    if (!workChangeReason.trim()) return;
    setWorkChangeDrawerOpen(false);
    setWorkChangeReason('');
    showToast(`Work record modification request for "${workChangeField}" sent to HR.`);
  };

  // Profile Photo Upload Handlers (File Explorer picker + Drag & Drop + Validation)
  const openPhotoDrawer = () => {
    setPhotoError('');
    setPhotoPreview(null);
    setPhotoFileName('');
    setPhotoDrawerOpen(true);
  };

  const triggerFileExplorer = () => {
    setPhotoError('');
    photoInputRef.current?.click();
  };

  const processSelectedPhoto = (file) => {
    setPhotoError('');
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setPhotoError('Unsupported format. Please select a JPG, PNG, or WEBP image.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setPhotoError('File size exceeds 2 MB limit. Please choose a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result);
      setPhotoFileName(`${file.name} (${(file.size / 1024).toFixed(0)} KB)`);
    };
    reader.onerror = () => {
      setPhotoError('Failed to read the selected image file.');
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoInputChange = (e) => {
    const file = e.target.files?.[0];
    processSelectedPhoto(file);
    // Reset input value so re-selecting the same file still fires onChange
    e.target.value = '';
  };

  const handlePhotoDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setPhotoDragActive(false);
    const file = e.dataTransfer.files?.[0];
    processSelectedPhoto(file);
  };

  const handleSavePhoto = async () => {
    if (!photoPreview) {
      triggerFileExplorer();
      return;
    }
    setIsSavingPhoto(true);
    try {
      await updateAvatar(photoPreview);
      setPhotoDrawerOpen(false);
      setPhotoPreview(null);
      setPhotoFileName('');
      showToast('Profile photo updated successfully.');
    } catch (err) {
      setPhotoError(err.message || 'Could not save profile photo.');
    } finally {
      setIsSavingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    setIsSavingPhoto(true);
    try {
      await updateAvatar(null);
      setPhotoPreview(null);
      setPhotoFileName('');
      setPhotoDrawerOpen(false);
      showToast('Profile photo removed. Reverted to initials avatar.');
    } finally {
      setIsSavingPhoto(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. PHEAD (Section 20 Header) */}
      <Card className="col-span-full p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* 88px Avatar with Change Photo Button */}
            <div className="relative group">
              <button
                type="button"
                onClick={openPhotoDrawer}
                aria-label="Update profile photo"
                className="rounded-full focus-visible:outline-2 focus-visible:outline-accent block cursor-pointer"
              >
                <Avatar name={user?.name || profile.name} src={user?.avatarUrl} size={88} className="shadow-lg" />
              </button>
              <button
                type="button"
                onClick={openPhotoDrawer}
                aria-label="Change profile photo"
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-accent text-on-accent flex items-center justify-center shadow-md hover:scale-110 transition-transform"
              >
                <Camera className="w-3.5 h-3.5" strokeWidth={1.8} />
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-display font-bold text-2xl text-ink">
                  {user?.name || profile.name}
                </h2>
                <StatusPill status="good" label="Active" />
              </div>

              <p className="text-muted text-sm font-medium">
                {profile.designation} · {profile.department}
              </p>

              <div className="flex items-center gap-2 flex-wrap pt-0.5">
                <Tag color="accent">EMPLOYEE</Tag>
                <Tag>{profile.id}</Tag>
                <Tag>{profile.location}</Tag>
              </div>
            </div>
          </div>

          {/* Quick Stat Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto">
            <div className="p-3 rounded-tpl bg-surface2/40 border border-line text-center">
              <span className="text-[11px] text-muted block">Tenure</span>
              <span className="font-display font-bold text-ink text-sm">3y 10m</span>
            </div>
            <div className="p-3 rounded-tpl bg-surface2/40 border border-line text-center">
              <span className="text-[11px] text-muted block">Reports To</span>
              <span className="font-semibold text-ink text-xs truncate max-w-[100px] block mx-auto">Priya Nair</span>
            </div>
            <div className="p-3 rounded-tpl bg-surface2/40 border border-line text-center">
              <span className="text-[11px] text-muted block">Shift</span>
              <span className="font-semibold text-ink text-xs">General</span>
            </div>
            <div className="p-3 rounded-tpl bg-surface2/40 border border-line text-center">
              <span className="text-[11px] text-muted block">Leave Quota</span>
              <span className="font-display font-bold text-accent text-sm">26.5 d</span>
            </div>
          </div>
        </div>

        {/* Profile Completeness Bar */}
        <div className="pt-4 border-t border-line/40 space-y-1.5 mt-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted">Profile Completeness: 92%</span>
            <span className="text-accent font-semibold">Ready for Annual Audit</span>
          </div>
          <Progress value={92} max={100} height={6} />
        </div>
      </Card>

      {/* 2. SUB-TABS */}
      <div className="flex items-center gap-1.5 p-1 rounded-full bg-surface2/60 border border-line w-fit">
        {[
          { id: 'personal', label: 'Personal Information' },
          { id: 'work', label: 'Employment Details (Locked)' },
          { id: 'emergency', label: 'Emergency Contacts (2)' },
          { id: 'activity', label: 'Security & Activity' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
              activeTab === tab.id
                ? 'bg-accent text-on-accent font-semibold shadow-sm'
                : 'text-muted hover:text-ink hover:bg-surface2'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: PERSONAL (EDITABLE) */}
      {activeTab === 'personal' && (
        <Card
          title="Personal Profile"
          subtext="Update your contact phone, personal email, and residential address"
        >
          <form onSubmit={handleSavePersonal} className="space-y-5 text-xs">
            {isDirty && (
              <div className="p-3 rounded-tpl bg-warn/10 border border-warn/40 text-warn flex items-center justify-between">
                <span>You have unsaved profile changes.</span>
                <div className="flex gap-2">
                  <SecondaryButton size="sm" type="button" onClick={handleDiscard}>
                    Discard
                  </SecondaryButton>
                  <PrimaryButton size="sm" type="submit" disabled={isSavingPersonal}>
                    {isSavingPersonal ? 'Saving...' : 'Save Changes'}
                  </PrimaryButton>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="profile-full-name" className="block text-muted font-medium mb-1">Full Name *</label>
                <input
                  id="profile-full-name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full bg-surface2 border border-line rounded-tpl px-3 py-2 text-ink text-sm focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="profile-preferred-name" className="block text-muted font-medium mb-1">Preferred First Name *</label>
                <input
                  id="profile-preferred-name"
                  type="text"
                  required
                  value={formData.preferredName}
                  onChange={(e) => handleInputChange('preferredName', e.target.value)}
                  className="w-full bg-surface2 border border-line rounded-tpl px-3 py-2 text-ink text-sm focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="profile-mobile" className="block text-muted font-medium mb-1">Mobile (+91 prefix) *</label>
                <input
                  id="profile-mobile"
                  type="tel"
                  required
                  value={formData.mobile}
                  onChange={(e) => handleInputChange('mobile', e.target.value)}
                  className="w-full bg-surface2 border border-line rounded-tpl px-3 py-2 text-ink text-sm focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="profile-personal-email" className="block text-muted font-medium mb-1">Personal Email *</label>
                <input
                  id="profile-personal-email"
                  type="email"
                  required
                  value={formData.personalEmail}
                  onChange={(e) => handleInputChange('personalEmail', e.target.value)}
                  className="w-full bg-surface2 border border-line rounded-tpl px-3 py-2 text-ink text-sm focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-muted font-medium mb-1">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className="w-full bg-surface2 border border-line rounded-tpl px-3 py-2 text-ink text-sm focus:border-accent focus:outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              <div>
                <label className="block text-muted font-medium mb-1">Blood Group</label>
                <select
                  value={formData.bloodGroup}
                  onChange={(e) => handleInputChange('bloodGroup', e.target.value)}
                  className="w-full bg-surface2 border border-line rounded-tpl px-3 py-2 text-ink text-sm focus:border-accent focus:outline-none"
                >
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>

              <div>
                <label className="block text-muted font-medium mb-1">Marital Status</label>
                <select
                  value={formData.maritalStatus}
                  onChange={(e) => handleInputChange('maritalStatus', e.target.value)}
                  className="w-full bg-surface2 border border-line rounded-tpl px-3 py-2 text-ink text-sm focus:border-accent focus:outline-none"
                >
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Address fields */}
            <div className="space-y-3 pt-2 border-t border-line/40">
              <span className="font-semibold text-ink text-sm block">Residential Address</span>
              <div>
                <label className="block text-muted font-medium mb-1">Current Street Address *</label>
                <input
                  type="text"
                  required
                  value={formData.currentAddress}
                  onChange={(e) => handleInputChange('currentAddress', e.target.value)}
                  className="w-full bg-surface2 border border-line rounded-tpl px-3 py-2 text-ink text-sm focus:border-accent focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="same-addr"
                  checked={formData.sameAsCurrent}
                  onChange={(e) => handleInputChange('sameAsCurrent', e.target.checked)}
                  className="accent-accent"
                />
                <label htmlFor="same-addr" className="text-muted text-xs cursor-pointer select-none">
                  Permanent address is same as current residential address
                </label>
              </div>

              {!formData.sameAsCurrent && (
                <div>
                  <label className="block text-muted font-medium mb-1">Permanent Address</label>
                  <input
                    type="text"
                    value={formData.permanentAddress}
                    onChange={(e) => handleInputChange('permanentAddress', e.target.value)}
                    className="w-full bg-surface2 border border-line rounded-tpl px-3 py-2 text-ink text-sm focus:border-accent focus:outline-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-muted font-medium mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="w-full bg-surface2 border border-line rounded-tpl px-3 py-2 text-ink text-sm focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-muted font-medium mb-1">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    className="w-full bg-surface2 border border-line rounded-tpl px-3 py-2 text-ink text-sm focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-muted font-medium mb-1">6-Digit PIN Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={formData.pincode}
                    onChange={(e) => handleInputChange('pincode', e.target.value)}
                    className="w-full bg-surface2 border border-line rounded-tpl px-3 py-2 text-ink text-sm focus:border-accent focus:outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <SecondaryButton type="button" onClick={handleDiscard} disabled={!isDirty}>
                Discard
              </SecondaryButton>
              <PrimaryButton type="submit" disabled={!isDirty || isSavingPersonal}>
                <Save className="w-3.5 h-3.5" /> {isSavingPersonal ? 'Saving...' : 'Save Changes'}
              </PrimaryButton>
            </div>
          </form>
        </Card>
      )}

      {/* TAB 2: WORK (READ-ONLY LOCKED) */}
      {activeTab === 'work' && (
        <Card
          title="Employment Record"
          subtext="Official company parameters maintained by HR Operations"
          action={
            <SecondaryButton size="sm" onClick={() => setWorkChangeDrawerOpen(true)}>
              Request a Change
            </SecondaryButton>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {[
              { label: 'Employee ID', value: profile.id, icon: Lock },
              { label: 'Official Designation', value: profile.designation, icon: Lock },
              { label: 'Department', value: profile.department, icon: Lock },
              { label: 'Official Work Email', value: profile.workEmail, icon: Lock },
              { label: 'Reporting Manager', value: `${profile.reportingManager.name} (${profile.reportingManager.designation})`, icon: Lock },
              { label: 'Date of Joining', value: formatDate(profile.joiningDate), icon: Lock },
              { label: 'Employment Type', value: profile.employmentType, icon: Lock },
              { label: 'Probation Status', value: profile.probationStatus, icon: Lock },
              { label: 'Work Location', value: profile.workLocation, icon: Lock },
              { label: 'Assigned Shift', value: profile.shift, icon: Lock }
            ].map((item, idx) => (
              <div key={idx} className="p-3.5 rounded-tpl bg-surface2/30 border border-line space-y-1">
                <div className="flex justify-between items-center text-muted">
                  <span>{item.label}</span>
                  <Lock className="w-3 h-3 text-muted/60" />
                </div>
                <div className="font-semibold text-ink text-[13px]">{item.value}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB 3: EMERGENCY CONTACTS */}
      {activeTab === 'emergency' && (
        <Card
          title="Emergency Contact Directory"
          subtext="Authorized individuals contacted in health or urgent medical situations"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {profile.emergencyContacts.map((c, idx) => (
              <div
                key={idx}
                className="p-4 rounded-tpl bg-surface2/30 border border-line space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-ink text-sm">{c.name}</span>
                  <Tag color="accent">{c.relation}</Tag>
                </div>
                <div className="text-muted space-y-1">
                  <p>• Phone: <strong className="text-ink font-mono">{c.phone}</strong></p>
                  <p>• City: <span className="text-ink">{c.address}</span></p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB 4: ACTIVITY LOG */}
      {activeTab === 'activity' && (
        <Card title="Recent Security & Profile Activity">
          <Table
            keyField="id"
            columns={[
              {
                header: 'Action / Event',
                key: 'action',
                render: (act) => <span className="font-medium text-ink">{act}</span>
              },
              {
                header: 'Timestamp',
                key: 'time',
                render: (t) => <span className="font-mono text-muted text-xs">{t}</span>
              },
              {
                header: 'IP Address',
                key: 'ip',
                render: (ip) => <Tag>{ip}</Tag>
              }
            ]}
            data={profile.activity}
          />
        </Card>
      )}

      {/* Change Photo Drawer */}
      <Drawer
        isOpen={photoDrawerOpen}
        onClose={() => !isSavingPhoto && setPhotoDrawerOpen(false)}
        title="Update Profile Photo"
        footer={
          <div className="w-full flex items-center justify-between gap-2 flex-wrap">
            {user?.avatarUrl ? (
              <SecondaryButton
                type="button"
                onClick={handleRemovePhoto}
                disabled={isSavingPhoto}
                className="text-bad border-bad/40 hover:border-bad"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remove Photo
              </SecondaryButton>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <SecondaryButton
                type="button"
                onClick={() => setPhotoDrawerOpen(false)}
                disabled={isSavingPhoto}
              >
                Cancel
              </SecondaryButton>
              <PrimaryButton
                type="button"
                onClick={handleSavePhoto}
                disabled={isSavingPhoto || !photoPreview}
              >
                {isSavingPhoto ? 'Saving...' : 'Save Profile Photo'}
              </PrimaryButton>
            </div>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <p className="text-muted leading-relaxed">
            Upload a professional headshot from your computer. Acceptable formats: JPG, PNG, or WEBP (maximum 2 MB).
          </p>

          {/* Current / Selected Avatar Preview */}
          <div className="p-4 rounded-tpl bg-surface2/40 border border-line flex items-center gap-4">
            <Avatar
              name={profile.name}
              src={photoPreview || user?.avatarUrl}
              size={68}
              className="shadow-md"
            />
            <div className="min-w-0 flex-1 space-y-1">
              <span className="text-[11px] uppercase tracking-wider text-muted font-semibold block">
                {photoPreview ? 'New Photo Preview' : user?.avatarUrl ? 'Current Photo' : 'Default Initials'}
              </span>
              <p className="font-semibold text-ink truncate">
                {photoFileName || (user?.avatarUrl ? 'Custom photo active' : `${profile.name} (${profile.id})`)}
              </p>
            </div>
          </div>

          {photoError && (
            <div role="alert" className="p-3 rounded-tpl bg-bad/10 border border-bad/40 text-bad flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{photoError}</span>
            </div>
          )}

          {/* Hidden File Input wired directly to File Explorer */}
          <input
            id="profile-photo-file-input"
            ref={photoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handlePhotoInputChange}
            className="sr-only"
          />

          {/* Interactive Clickable + Drag-and-Drop Zone */}
          <label
            htmlFor="profile-photo-file-input"
            onDragEnter={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setPhotoDragActive(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setPhotoDragActive(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setPhotoDragActive(false);
            }}
            onDrop={handlePhotoDrop}
            className={`block p-8 border-2 border-dashed rounded-tpl text-center space-y-2.5 transition-colors cursor-pointer ${
              photoDragActive
                ? 'border-accent bg-accent/10'
                : 'border-line hover:border-accent bg-surface2/20'
            }`}
          >
            <Upload className="w-8 h-8 text-accent mx-auto" />
            <p className="font-semibold text-ink text-sm">
              {photoPreview ? 'Choose a different photo' : 'Click to open File Explorer or drag photo here'}
            </p>
            <p className="text-muted text-[11px]">JPG, PNG, or WEBP · Max 2 MB · Square 1:1 recommended</p>
            <div className="pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface2 border border-line text-ink font-medium text-[11px]">
                <Camera className="w-3.5 h-3.5 text-accent" /> Browse Computer
              </span>
            </div>
          </label>
        </div>
      </Drawer>

      {/* Request Work Change Drawer */}
      <Drawer
        isOpen={workChangeDrawerOpen}
        onClose={() => setWorkChangeDrawerOpen(false)}
        title="Request Work Record Change"
        footer={
          <div className="flex gap-2">
            <SecondaryButton onClick={() => setWorkChangeDrawerOpen(false)}>Cancel</SecondaryButton>
            <PrimaryButton onClick={handleWorkChangeSubmit}>Send HR Request</PrimaryButton>
          </div>
        }
      >
        <form onSubmit={handleWorkChangeSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-muted font-medium mb-1">Field to Update</label>
            <select
              value={workChangeField}
              onChange={(e) => setWorkChangeField(e.target.value)}
              className="w-full bg-surface2 border border-line rounded-tpl px-3 py-2 text-ink text-sm focus:border-accent focus:outline-none"
            >
              <option value="Designation">Designation</option>
              <option value="Department">Department</option>
              <option value="Reporting Manager">Reporting Manager</option>
              <option value="Work Location">Work Location</option>
              <option value="Shift Timing">Shift Timing</option>
            </select>
          </div>

          <div>
            <label className="block text-muted font-medium mb-1">Proposed Value & Reason *</label>
            <textarea
              required
              rows={4}
              value={workChangeReason}
              onChange={(e) => setWorkChangeReason(e.target.value)}
              placeholder="State the requested change and provide justification..."
              className="w-full bg-surface2 border border-line rounded-tpl px-3 py-2 text-ink text-sm focus:border-accent focus:outline-none"
            />
          </div>
        </form>
      </Drawer>
    </div>
  );
}

export default Profile;

