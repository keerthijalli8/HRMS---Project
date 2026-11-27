import React from 'react';
import { ExternalLink, MapPin, X } from 'lucide-react';
import { ModalPortal } from './ModalPortal.jsx';

const latitudeOf = location => location?.latitude ?? location?.lat;
const longitudeOf = location => location?.longitude ?? location?.lng;
const hasCoordinates = location => latitudeOf(location) != null && longitudeOf(location) != null && Number.isFinite(Number(latitudeOf(location))) && Number.isFinite(Number(longitudeOf(location)));
const formatTimestamp = timestamp => {
  if (timestamp == null || timestamp === '') return '—';
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? String(timestamp) : date.toLocaleString();
};

const AttendanceLocationDetails = ({ title, timestamp, location, pending = false }) => {
  if (pending) return <section className="rounded-xl border border-slate-700/80 bg-[#1c2230] p-4">
    <h3 className="font-semibold">{title}</h3>
    <p className="mt-2 text-sm text-slate-400">Pending check-out</p>
  </section>;

  const coordsExist = hasCoordinates(location);
  const latitude = coordsExist ? Number(latitudeOf(location)) : null;
  const longitude = coordsExist ? Number(longitudeOf(location)) : null;
  const address = location?.address || location?.label || '';
  const mapQuery = coordsExist ? `${latitude},${longitude}` : address;
  const mapUrl = mapQuery ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}` : null;

  return <section className="rounded-xl border border-slate-700/80 bg-[#1c2230] p-4">
    <h3 className="font-semibold">{title}</h3>
    <dl className="mt-3 space-y-3 text-sm">
      <div><dt className="text-xs text-slate-400">Time</dt><dd className="mt-1">{formatTimestamp(timestamp)}</dd></div>
      <div><dt className="text-xs text-slate-400">Coordinates</dt><dd className="mt-1 font-mono text-xs">{coordsExist ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` : 'Location unavailable for this record.'}</dd></div>
      {location?.accuracy != null && <div><dt className="text-xs text-slate-400">Accuracy</dt><dd className="mt-1">{Number(location.accuracy).toLocaleString()} m</dd></div>}
      {address && <div><dt className="text-xs text-slate-400">Address / label</dt><dd className="mt-1 text-teal-200">{address}</dd></div>}
    </dl>
    {mapUrl && <a href={mapUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-teal-200 px-3 py-2 text-xs font-bold text-slate-900 hover:bg-teal-100">Open map <ExternalLink size={13} /></a>}
  </section>;
};

export const LocationModal = ({ open, onClose, userName, userRole, punchType, timestamp, location, attendanceRecord }) => {
  if (!open) return null;
  if (attendanceRecord) return <ModalPortal onClose={onClose} ariaLabelledby="location-modal-title" closeOnBackdrop>
    <section className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[#34515b] bg-[#142c37] p-5 text-slate-100 shadow-2xl sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div><h2 id="location-modal-title" className="text-lg font-bold">Attendance details</h2><p className="mt-1 text-xs text-slate-400">{userName || 'Unknown user'} · {userRole || 'Team member'}</p></div>
        <button onClick={onClose} aria-label="Close attendance details" className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"><X size={18} /></button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <AttendanceLocationDetails title="Check-In Location" timestamp={attendanceRecord.checkInTime || attendanceRecord.checkInLocation?.capturedAt} location={attendanceRecord.checkInLocation} />
        <AttendanceLocationDetails title="Check-Out Location" timestamp={attendanceRecord.checkOutTime || attendanceRecord.checkOutLocation?.capturedAt} location={attendanceRecord.checkOutLocation} pending={!attendanceRecord.checkOutTime} />
      </div>
    </section>
  </ModalPortal>;

  const coordsExist = hasCoordinates(location);
  const latitude = coordsExist ? Number(latitudeOf(location)) : null;
  const longitude = coordsExist ? Number(longitudeOf(location)) : null;
  const label = location?.address || location?.label || (coordsExist ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` : typeof location === 'string' ? location : 'Location unavailable');
  const mapQuery = coordsExist ? `${latitude},${longitude}` : label;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;
  const osmUrl = `https://www.openstreetmap.org/search?query=${encodeURIComponent(mapQuery)}`;
  const readableTimestamp = formatTimestamp(timestamp);

  return <ModalPortal onClose={onClose} ariaLabelledby="location-modal-title" closeOnBackdrop>
    <section className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-[#34515b] bg-[#142c37] p-5 text-slate-100 shadow-2xl sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-300/10 text-teal-200"><MapPin size={19} /></span>
          <div><h2 id="location-modal-title" className="text-lg font-bold">Punch location</h2><p className="text-xs text-slate-400">{punchType || 'Attendance record'}</p></div>
        </div>
        <button onClick={onClose} aria-label="Close location details" className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"><X size={18} /></button>
      </div>
      <dl className="mt-6 space-y-4 rounded-xl border border-slate-700/80 bg-[#1c2230] p-4 text-sm">
        <div><dt className="text-xs text-slate-400">Employee</dt><dd className="mt-1 font-semibold">{userName || 'Unknown user'} <span className="font-normal text-slate-400">· {userRole || 'Team member'}</span></dd></div>
        <div><dt className="text-xs text-slate-400">Timestamp</dt><dd className="mt-1 font-medium">{readableTimestamp}</dd></div>
        <div><dt className="text-xs text-slate-400">Area</dt><dd className="mt-1 font-medium text-teal-200">{label}</dd></div>
        <div><dt className="text-xs text-slate-400">GPS coordinates</dt><dd className="mt-1 font-mono text-xs">{coordsExist ? `Latitude ${latitude.toFixed(6)} · Longitude ${longitude.toFixed(6)}` : 'Exact coordinates are not available for this record.'}</dd></div>
        {location?.accuracy != null && <div><dt className="text-xs text-slate-400">Accuracy</dt><dd className="mt-1">{Number(location.accuracy).toLocaleString()} m</dd></div>}
      </dl>
      <div className="mt-5 flex flex-wrap gap-2">
        <a href={googleMapsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-teal-200 px-3 py-2 text-xs font-bold text-slate-900 hover:bg-teal-100">Google Maps <ExternalLink size={13} /></a>
        <a href={osmUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-slate-600 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/5">OpenStreetMap <ExternalLink size={13} /></a>
      </div>
      <p className="mt-3 text-[10px] text-slate-500">Map links open in a new tab. Map data © OpenStreetMap contributors.</p>
    </section>
  </ModalPortal>;
};
