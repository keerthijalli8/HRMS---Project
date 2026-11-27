// src/components/LocationMap.jsx
// Interactive Google Maps Platform (Maps JavaScript API via @vis.gl/react-google-maps) location mapper.
// Replaces custom SVG radar with real Google Map, Satellite/Roadmap toggle, zoom & fit controls,
// non-overlapping Check-In ("In") & Check-Out ("Out") markers with InfoWindows, and 300m office geofence circle.

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  APIProvider,
  APILoadingStatus,
  Map as GoogleMap,
  AdvancedMarker,
  InfoWindow,
  Circle,
  useAdvancedMarkerRef,
  useApiLoadingStatus,
  useMap,
  useMapsLibrary
} from '@vis.gl/react-google-maps';
import {
  MapPin,
  ExternalLink,
  Building2,
  Crosshair,
  ZoomIn,
  ZoomOut,
  LocateFixed,
  Navigation,
  AlertTriangle
} from 'lucide-react';
import { ATTENDANCE_RULES } from '../config/attendanceRules.js';
import {
  calculateDistanceMeters,
  formatCoordinates,
  formatDistance,
  buildGoogleMapsPlaceUrl,
  buildGoogleMapsDirectionsUrl,
  buildGoogleMapsPunchUrl
} from '../utils/geo.js';
import { formatTime12 } from '../utils/format.js';
import { Tag } from './Tag.jsx';

const INTERNAL_ATTRIBUTION_IDS = ['gmp_git_agentskills_v1'];
const DEMO_MAP_ID = 'DEMO_MAP_ID';

const Z_INDEX_OFFICE = 10;
const Z_INDEX_IN = 20;
const Z_INDEX_OUT = 30;
const Z_INDEX_SELECTED = 1000;

function readMapsApiKey() {
  return (import.meta.env?.VITE_GOOGLE_MAPS_API_KEY || '').trim();
}

function resolveDisplayTime(rawTime, fallbackCapturedAt) {
  if (rawTime) return formatTime12(rawTime);
  if (fallbackCapturedAt) {
    const dt = new Date(fallbackCapturedAt);
    if (!isNaN(dt.getTime())) return formatTime12(dt);
  }
  return 'Not recorded';
}

function getDistanceFromOffice(loc, geofence) {
  if (!loc || loc.latitude == null || loc.longitude == null) {
    return typeof loc?.distanceMeters === 'number' ? loc.distanceMeters : 0;
  }
  return calculateDistanceMeters(
    Number(loc.latitude),
    Number(loc.longitude),
    geofence.latitude,
    geofence.longitude
  );
}

/**
 * Separates two nearly identical coordinates slightly on the visual map pin layer (<10m)
 * while leaving the true coordinates untouched inside InfoWindows and cards.
 */
function getVisualMarkerPosition(targetLoc, referenceLoc) {
  if (!targetLoc) return null;
  const base = { lat: Number(targetLoc.latitude), lng: Number(targetLoc.longitude) };
  if (!referenceLoc) return base;

  const separationMeters = calculateDistanceMeters(
    targetLoc.latitude,
    targetLoc.longitude,
    referenceLoc.latitude,
    referenceLoc.longitude
  );

  if (separationMeters < 10) {
    return {
      lat: Number((base.lat - 0.000045).toFixed(6)),
      lng: Number((base.lng + 0.000065).toFixed(6))
    };
  }
  return base;
}

/**
 * Auto-fits camera bounds to display Check-In, Check-Out, and Office coordinates cleanly.
 */
function MapViewportSync({ points, fitSignal, onMapReady }) {
  const map = useMap();
  const coreLib = useMapsLibrary('core');

  useEffect(() => {
    if (map && onMapReady) {
      onMapReady(map);
    }
  }, [map, onMapReady]);

  const pointsKey = points.map((p) => `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`).join('|');

  useEffect(() => {
    if (!map || !coreLib || points.length === 0) return;

    const bounds = new coreLib.LatLngBounds();
    points.forEach((pt) => bounds.extend(pt));
    map.fitBounds(bounds, { top: 46, right: 46, bottom: 46, left: 46 });

    const listener = map.addListener('idle', () => {
      const currentZoom = map.getZoom();
      if (typeof currentZoom === 'number' && currentZoom > 18) {
        map.setZoom(18);
      }
      listener?.remove?.();
    });

    return () => listener?.remove?.();
  }, [map, coreLib, pointsKey, fitSignal]);

  return null;
}

/**
 * Custom HTML AdvancedMarker badge with ref forwarding so InfoWindow can anchor directly to it.
 */
function PunchAdvancedMarker({
  id,
  position,
  label,
  timeText,
  variant,
  isSelected,
  zIndex,
  onSelect
}) {
  const [markerRef, marker] = useAdvancedMarkerRef();

  const palette =
    variant === 'in'
      ? { bg: '#16a34a', border: '#dcfce7', ring: 'rgba(22,163,74,0.35)' }
      : variant === 'out'
        ? { bg: '#9333ea', border: '#f3e8ff', ring: 'rgba(147,51,234,0.35)' }
        : { bg: '#0f172a', border: '#6ee7d0', ring: 'rgba(110,231,208,0.28)' };

  return (
    <AdvancedMarker
      ref={markerRef}
      position={position}
      zIndex={isSelected ? Z_INDEX_SELECTED : zIndex}
      title={`${label}${timeText ? ` · ${timeText}` : ''}`}
      onClick={() => {
        if (marker) {
          onSelect(id, marker);
        }
      }}
    >
      <div
        className="flex flex-col items-center cursor-pointer transition-transform hover:scale-105"
        style={{ transform: isSelected ? 'scale(1.06)' : undefined }}
      >
        <div
          style={{
            backgroundColor: palette.bg,
            border: `2px solid ${palette.border}`,
            boxShadow: `0 4px 14px ${palette.ring}, 0 2px 6px rgba(0,0,0,0.45)`,
            color: '#ffffff'
          }}
          className="px-2 py-0.5 rounded-full flex items-center gap-1.5 text-[11px] font-bold tracking-tight whitespace-nowrap"
        >
          <span>{label}</span>
          {timeText && (
            <span
              style={{
                backgroundColor: 'rgba(0,0,0,0.24)',
                color: '#ffffff'
              }}
              className="px-1.5 py-0.2 rounded-full font-mono text-[10px] font-semibold"
            >
              {timeText}
            </span>
          )}
        </div>
        <div
          style={{
            width: 0,
            height: 0,
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderTop: `6px solid ${palette.bg}`
          }}
        />
      </div>
    </AdvancedMarker>
  );
}

function GoogleMapInner({
  officeCenter,
  geofenceRadius,
  campusName,
  inMarkerData,
  outMarkerData,
  mapType,
  onMapTypeChange,
  fitSignal,
  onMapReady
}) {
  const status = useApiLoadingStatus();
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [selectedInfo, setSelectedInfo] = useState(null);

  const markerItems = useMemo(() => {
    const list = [];
    if (inMarkerData) list.push(inMarkerData);
    if (outMarkerData) list.push(outMarkerData);
    return list;
  }, [inMarkerData, outMarkerData]);

  const viewportPoints = useMemo(() => {
    const pts = [];
    // Include office anchor only when near campus so Remote/WFH locations zoom in tightly on exact pins
    const isNearCampus =
      !inMarkerData || inMarkerData.distanceMeters <= geofenceRadius * 2;
    if (isNearCampus) pts.push(officeCenter);
    if (inMarkerData) pts.push(inMarkerData.rawPosition);
    if (outMarkerData) pts.push(outMarkerData.rawPosition);
    if (pts.length === 0) pts.push(officeCenter);
    return pts;
  }, [officeCenter, geofenceRadius, inMarkerData, outMarkerData]);

  const handleSelectMarker = useCallback(
    (id, markerInstance) => {
      if (id === 'office') {
        setSelectedMarker(markerInstance);
        setSelectedInfo({
          id: 'office',
          title: `${campusName} (Office Hub)`,
          badgeColor: '#0f766e',
          timeText: `${geofenceRadius}m Authorized Geofence`,
          lat: officeCenter.lat,
          lng: officeCenter.lng,
          distanceMeters: 0,
          inGeofence: true,
          address: ATTENDANCE_RULES.geofence.address
        });
        return;
      }

      const found = markerItems.find((item) => item.id === id);
      if (!found) return;
      setSelectedMarker(markerInstance);
      setSelectedInfo(found);
    },
    [campusName, geofenceRadius, officeCenter, markerItems]
  );

  // Close stale InfoWindow when attendance row changes
  useEffect(() => {
    setSelectedMarker(null);
    setSelectedInfo(null);
  }, [inMarkerData?.rawPosition?.lat, inMarkerData?.rawPosition?.lng, outMarkerData?.rawPosition?.lat, outMarkerData?.rawPosition?.lng]);

  if (status === APILoadingStatus.AUTH_FAILURE || status === APILoadingStatus.FAILED) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-5 text-center space-y-2 bg-surface2/50">
        <AlertTriangle className="w-7 h-7 text-warn" />
        <p className="text-xs font-semibold text-ink">
          Google Maps failed to load ({status === APILoadingStatus.AUTH_FAILURE ? 'Invalid or restricted API key' : 'Network/script error'})
        </p>
        <p className="text-[11px] text-muted max-w-sm">
          Verify that <code>VITE_GOOGLE_MAPS_API_KEY</code> is valid and has the <strong>Maps JavaScript API</strong> enabled with HTTP referrer access for this domain.
        </p>
      </div>
    );
  }

  return (
    <GoogleMap
      mapId={DEMO_MAP_ID}
      defaultCenter={inMarkerData?.rawPosition || officeCenter}
      defaultZoom={17}
      mapTypeId={mapType}
      onMapTypeIdChanged={(ev) => {
        const nextType = ev.map?.getMapTypeId?.();
        if (nextType && (nextType === 'roadmap' || nextType === 'satellite')) {
          onMapTypeChange(nextType);
        }
      }}
      gestureHandling="greedy"
      zoomControl={true}
      mapTypeControl={true}
      streetViewControl={false}
      fullscreenControl={true}
      internalUsageAttributionIds={INTERNAL_ATTRIBUTION_IDS}
      style={{ width: '100%', height: '100%' }}
    >
      <MapViewportSync
        points={viewportPoints}
        fitSignal={fitSignal}
        onMapReady={onMapReady}
      />

      {/* Official 300m Office Geofence Circle */}
      <Circle
        center={officeCenter}
        radius={geofenceRadius}
        clickable={false}
        strokeColor={mapType === 'satellite' ? '#6ee7d0' : '#0d9488'}
        strokeOpacity={0.95}
        strokeWeight={2}
        fillColor="#14b8a6"
        fillOpacity={0.14}
      />

      {/* Office Center Anchor Marker */}
      <PunchAdvancedMarker
        id="office"
        position={officeCenter}
        label="Office"
        timeText={`${geofenceRadius}m`}
        variant="office"
        zIndex={Z_INDEX_OFFICE}
        isSelected={selectedInfo?.id === 'office'}
        onSelect={handleSelectMarker}
      />

      {/* Check-In ("In") & Check-Out ("Out") Markers */}
      {markerItems.map((item) => (
        <PunchAdvancedMarker
          key={item.id}
          id={item.id}
          position={item.displayPosition}
          label={item.shortLabel}
          timeText={item.timeText}
          variant={item.variant}
          zIndex={item.zIndex}
          isSelected={selectedInfo?.id === item.id}
          onSelect={handleSelectMarker}
        />
      ))}

      {/* Marker InfoWindow showing time, coordinates, and distance from office */}
      {selectedInfo && selectedMarker && (
        <InfoWindow
          anchor={selectedMarker}
          maxWidth={270}
          pixelOffset={[0, -4]}
          onCloseClick={() => {
            setSelectedMarker(null);
            setSelectedInfo(null);
          }}
        >
          <div style={{ color: '#0f172a', minWidth: '205px' }} className="space-y-1.5 text-xs p-0.5">
            <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-200">
              <span className="font-bold text-[13px] flex items-center gap-1.5" style={{ color: '#0f172a' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '9999px',
                    backgroundColor: selectedInfo.badgeColor,
                    display: 'inline-block'
                  }}
                />
                {selectedInfo.title}
              </span>
              <span
                style={{
                  backgroundColor: selectedInfo.inGeofence ? '#dcfce7' : '#fef3c7',
                  color: selectedInfo.inGeofence ? '#166534' : '#92400e',
                  padding: '1px 6px',
                  borderRadius: '9999px',
                  fontSize: '10px',
                  fontWeight: 600
                }}
              >
                {selectedInfo.inGeofence ? 'In 300m Zone' : 'Outside Zone'}
              </span>
            </div>

            <div className="space-y-1" style={{ color: '#334155' }}>
              <div>
                <span style={{ color: '#64748b' }}>Time: </span>
                <strong style={{ color: '#0f172a' }}>{selectedInfo.timeText}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Coordinates: </span>
                <div className="font-mono text-[11px] font-semibold" style={{ color: '#0f172a' }}>
                  {formatCoordinates(selectedInfo.lat, selectedInfo.lng)}
                </div>
                <div className="font-mono text-[10px]" style={{ color: '#64748b' }}>
                  ({Number(selectedInfo.lat).toFixed(6)}, {Number(selectedInfo.lng).toFixed(6)})
                </div>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Distance from Office: </span>
                <strong style={{ color: '#0f172a' }}>
                  {formatDistance(selectedInfo.distanceMeters)} from {campusName}
                </strong>
              </div>
              {selectedInfo.address && (
                <div className="text-[11px] pt-0.5" style={{ color: '#475569' }}>
                  {selectedInfo.address}
                </div>
              )}
            </div>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}

export function LocationMap({
  checkInLocation,
  checkOutLocation,
  checkInTime,
  checkOutTime,
  activeLocation,
  activeTime,
  workMode = 'Office',
  showBothPunches = true,
  height = 300,
  className = ''
}) {
  const apiKey = readMapsApiKey();
  const [mapType, setMapType] = useState('roadmap'); // 'roadmap' | 'satellite'
  const [mapInstance, setMapInstance] = useState(null);
  const [fitSignal, setFitSignal] = useState(0);

  const geofence = ATTENDANCE_RULES.geofence;
  const geofenceRadius = geofence.radiusMeters || 300;
  const officeCenter = useMemo(
    () => ({ lat: geofence.latitude, lng: geofence.longitude }),
    [geofence.latitude, geofence.longitude]
  );

  const primaryInLoc = checkInLocation || activeLocation || {
    latitude: geofence.latitude,
    longitude: geofence.longitude,
    accuracy: 10,
    address: `${geofence.campusName}, Hyderabad`,
    inGeofence: true,
    distanceMeters: 0
  };

  const resolvedMode = primaryInLoc.workMode || workMode || 'Office';
  const isRemoteMode = resolvedMode === 'Remote' || resolvedMode === 'Work from home';

  const inDistance = getDistanceFromOffice(primaryInLoc, geofence);
  const outDistance = checkOutLocation ? getDistanceFromOffice(checkOutLocation, geofence) : null;

  const inMarkerData = useMemo(() => {
    const timeText = resolveDisplayTime(checkInTime || activeTime, primaryInLoc.capturedAt);
    return {
      id: 'in',
      shortLabel: 'In',
      title: activeLocation && !checkInLocation ? 'Current GPS Position' : 'Check-In Punch',
      variant: 'in',
      badgeColor: '#16a34a',
      zIndex: Z_INDEX_IN,
      timeText,
      lat: Number(primaryInLoc.latitude),
      lng: Number(primaryInLoc.longitude),
      rawPosition: { lat: Number(primaryInLoc.latitude), lng: Number(primaryInLoc.longitude) },
      displayPosition: { lat: Number(primaryInLoc.latitude), lng: Number(primaryInLoc.longitude) },
      distanceMeters: inDistance,
      inGeofence: primaryInLoc.inGeofence ?? inDistance <= geofenceRadius,
      isSimulated: !!primaryInLoc.isSimulated,
      address: primaryInLoc.address || `${geofence.campusName}, Hyderabad`
    };
  }, [primaryInLoc, checkInLocation, activeLocation, checkInTime, activeTime, inDistance, geofenceRadius, geofence.campusName]);

  const outMarkerData = useMemo(() => {
    if (!showBothPunches || !checkOutLocation || checkOutLocation.latitude == null) return null;
    const timeText = resolveDisplayTime(checkOutTime, checkOutLocation.capturedAt);
    return {
      id: 'out',
      shortLabel: 'Out',
      title: 'Check-Out Punch',
      variant: 'out',
      badgeColor: '#9333ea',
      zIndex: Z_INDEX_OUT,
      timeText,
      lat: Number(checkOutLocation.latitude),
      lng: Number(checkOutLocation.longitude),
      rawPosition: { lat: Number(checkOutLocation.latitude), lng: Number(checkOutLocation.longitude) },
      displayPosition: getVisualMarkerPosition(checkOutLocation, primaryInLoc),
      distanceMeters: outDistance,
      inGeofence: checkOutLocation.inGeofence ?? outDistance <= geofenceRadius,
      address: checkOutLocation.address || `${geofence.campusName}, Hyderabad`
    };
  }, [showBothPunches, checkOutLocation, checkOutTime, primaryInLoc, outDistance, geofenceRadius, geofence.campusName]);

  const handleZoomBy = (delta) => {
    if (!mapInstance) return;
    const current = mapInstance.getZoom() || 17;
    mapInstance.setZoom(Math.max(10, Math.min(21, current + delta)));
  };

  const punchOverviewUrl = useMemo(
    () => buildGoogleMapsPunchUrl(primaryInLoc, outMarkerData ? checkOutLocation : null, geofence),
    [primaryInLoc, outMarkerData, checkOutLocation, geofence]
  );
  const inMapsUrl = buildGoogleMapsPlaceUrl(inMarkerData.lat, inMarkerData.lng);
  const outMapsUrl = outMarkerData ? buildGoogleMapsPlaceUrl(outMarkerData.lat, outMarkerData.lng) : null;
  const routeMapsUrl = outMarkerData
    ? buildGoogleMapsDirectionsUrl(
        { latitude: inMarkerData.lat, longitude: inMarkerData.lng },
        { latitude: outMarkerData.lat, longitude: outMarkerData.lng }
      )
    : null;
  const officeMapsUrl = buildGoogleMapsPlaceUrl(geofence.latitude, geofence.longitude);

  const statusTagColor = isRemoteMode ? 'info' : inMarkerData.inGeofence ? 'good' : 'warn';
  const statusTagLabel =
    resolvedMode === 'Remote'
      ? 'Remote GPS · Exact Pin'
      : resolvedMode === 'Work from home'
        ? 'WFH GPS · Exact Pin'
        : inMarkerData.inGeofence
          ? `Inside ${geofenceRadius}m Perimeter`
          : 'Outside 300m Perimeter';

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Top Map Meta & Controls Strip */}
      <div className="flex items-center justify-between text-xs flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-ink flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-accent" />
            Google Maps GPS View
          </span>
          <Tag color={statusTagColor}>{statusTagLabel}</Tag>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {apiKey && (
            <>
              {/* Satellite / Roadmap Toggle */}
              <div
                className="inline-flex rounded-full bg-surface2 border border-line p-0.5 text-[11px]"
                role="group"
                aria-label="Map layer mode"
              >
                <button
                  type="button"
                  onClick={() => setMapType('roadmap')}
                  className={`px-2 py-0.5 rounded-full font-medium transition-colors ${
                    mapType === 'roadmap' ? 'bg-accent text-on-accent font-semibold' : 'text-muted hover:text-ink'
                  }`}
                >
                  Roadmap
                </button>
                <button
                  type="button"
                  onClick={() => setMapType('satellite')}
                  className={`px-2 py-0.5 rounded-full font-medium transition-colors ${
                    mapType === 'satellite' ? 'bg-accent text-on-accent font-semibold' : 'text-muted hover:text-ink'
                  }`}
                >
                  Satellite
                </button>
              </div>

              {/* Quick Zoom & Fit Bounds Controls */}
              <div className="inline-flex items-center rounded-full bg-surface2 border border-line px-1 py-0.5 gap-0.5">
                <button
                  type="button"
                  onClick={() => handleZoomBy(-1)}
                  className="p-1 rounded-full text-muted hover:text-ink hover:bg-surface transition-colors"
                  title="Zoom out"
                  aria-label="Zoom out"
                >
                  <ZoomOut className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => handleZoomBy(1)}
                  className="p-1 rounded-full text-muted hover:text-ink hover:bg-surface transition-colors"
                  title="Zoom in"
                  aria-label="Zoom in"
                >
                  <ZoomIn className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setFitSignal((s) => s + 1)}
                  className="p-1 rounded-full text-muted hover:text-accent hover:bg-surface transition-colors"
                  title="Fit office & markers"
                  aria-label="Fit map bounds"
                >
                  <LocateFixed className="w-3 h-3" />
                </button>
              </div>
            </>
          )}

          <a
            href={punchOverviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-accent hover:underline flex items-center gap-1 font-medium"
            title="Open in Google Maps"
          >
            <span>Open in Google Maps</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Interactive Google Map Canvas or Direct Google Maps Launch Panel */}
      <div
        className="relative w-full rounded-tpl bg-surface2/40 border border-line overflow-hidden shadow-inner"
        style={{ height: `${height}px` }}
      >
        {apiKey ? (
          <APIProvider apiKey={apiKey} libraries={['marker']} language="en" region="IN">
            <GoogleMapInner
              officeCenter={officeCenter}
              geofenceRadius={geofenceRadius}
              campusName={geofence.campusName}
              inMarkerData={inMarkerData}
              outMarkerData={outMarkerData}
              mapType={mapType}
              onMapTypeChange={setMapType}
              fitSignal={fitSignal}
              onMapReady={setMapInstance}
            />
          </APIProvider>
        ) : (
          <div
            data-testid="google-maps-direct-panel"
            className="w-full h-full flex flex-col items-center justify-center p-5 text-center space-y-3.5 bg-surface2/40"
          >
            <div className="w-11 h-11 rounded-full bg-accent/15 border border-accent/40 flex items-center justify-center">
              <Navigation className="w-5 h-5 text-accent" />
            </div>

            <div className="space-y-1 max-w-sm">
              <p className="text-sm font-semibold text-ink">
                Open Exact Location on Google Maps
              </p>
              <p className="text-[11px] text-muted leading-relaxed">
                {isRemoteMode
                  ? `Exact ${resolvedMode} GPS pin (${formatCoordinates(inMarkerData.lat, inMarkerData.lng)}) ready without road snapping — ${formatDistance(inMarkerData.distanceMeters)} from office.`
                  : 'Exact GPS pin ready for satellite or street inspection without road snapping.'}
              </p>
            </div>

            <a
              href={punchOverviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="open-google-maps-primary"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-on-accent text-xs font-semibold shadow-sm hover:opacity-90 transition-opacity"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Open Exact Pin on Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <div className="flex items-center justify-center gap-2 flex-wrap pt-1">
              <a
                href={inMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface2 border border-line hover:border-good/60 text-[11px] font-medium text-ink transition-colors"
              >
                <span className="w-2 h-2 rounded-full bg-good" />
                <span>Check-In Pin</span>
                <ExternalLink className="w-3 h-3 text-muted" />
              </a>

              {outMapsUrl && (
                <a
                  href={outMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface2 border border-line hover:border-accent2/60 text-[11px] font-medium text-ink transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-accent2" />
                  <span>Check-Out Pin</span>
                  <ExternalLink className="w-3 h-3 text-muted" />
                </a>
              )}

              {routeMapsUrl && (
                <a
                  href={routeMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface2 border border-line hover:border-accent/60 text-[11px] font-medium text-ink transition-colors"
                >
                  <Navigation className="w-3 h-3 text-accent" />
                  <span>In → Out Route</span>
                  <ExternalLink className="w-3 h-3 text-muted" />
                </a>
              )}

              <a
                href={officeMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface2 border border-line hover:border-accent/60 text-[11px] font-medium text-ink transition-colors"
              >
                <Building2 className="w-3 h-3 text-info" />
                <span>Office ({geofenceRadius}m)</span>
                <ExternalLink className="w-3 h-3 text-muted" />
              </a>
            </div>

            {inMarkerData.isSimulated && (
              <p className="text-[10px] text-warn/90 max-w-sm leading-snug pt-0.5">
                Fallback coordinates shown. Enable browser Location permission and click Recalibrate GPS for your live coordinates.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Marker Legend & Coordinate Readout Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <a
          href={inMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-3 rounded-tpl bg-surface2/30 border border-line hover:border-good/50 transition-colors space-y-1 block"
          title="Open Check-In pin in Google Maps"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-good inline-block" />
              In · {inMarkerData.timeText}
            </span>
            <span className="font-mono text-[11px] font-semibold text-accent flex items-center gap-1">
              {formatDistance(inMarkerData.distanceMeters)}
              <ExternalLink className="w-3 h-3" />
            </span>
          </div>
          <div className="font-mono font-semibold text-ink text-[12px]">
            {formatCoordinates(inMarkerData.lat, inMarkerData.lng)}
          </div>
          <span className="text-[11px] text-muted block truncate">
            {inMarkerData.address}
          </span>
        </a>

        {outMarkerData ? (
          <a
            href={outMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-tpl bg-surface2/30 border border-line hover:border-accent2/50 transition-colors space-y-1 block"
            title="Open Check-Out pin in Google Maps"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-accent2 inline-block" />
                Out · {outMarkerData.timeText}
              </span>
              <span className="font-mono text-[11px] font-semibold text-accent2 flex items-center gap-1">
                {formatDistance(outMarkerData.distanceMeters)}
                <ExternalLink className="w-3 h-3" />
              </span>
            </div>
            <div className="font-mono font-semibold text-ink text-[12px]">
              {formatCoordinates(outMarkerData.lat, outMarkerData.lng)}
            </div>
            <span className="text-[11px] text-muted block truncate">
              {outMarkerData.address}
            </span>
          </a>
        ) : (
          <a
            href={officeMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-tpl bg-surface2/30 border border-line hover:border-accent/50 transition-colors space-y-1 block"
            title="Open Office Campus anchor in Google Maps"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted flex items-center gap-1.5 font-medium">
                <Building2 className="w-3.5 h-3.5 text-info" /> Official Worksite Anchor
              </span>
              <ExternalLink className="w-3 h-3 text-muted" />
            </div>
            <div className="font-semibold text-ink text-[12px] truncate">
              {geofence.campusName}
            </div>
            <span className="text-[11px] text-muted font-mono block">
              {formatCoordinates(geofence.latitude, geofence.longitude)} ({geofenceRadius}m Zone)
            </span>
          </a>
        )}
      </div>

      {outMarkerData && (
        <a
          href={officeMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-2 rounded-tpl bg-surface2/20 border border-line/60 hover:border-accent/50 transition-colors flex items-center justify-between text-[11px] text-muted flex-wrap gap-2"
          title="Open Office Anchor in Google Maps"
        >
          <span className="flex items-center gap-1.5">
            <Crosshair className="w-3 h-3 text-accent" />
            <span>
              Office Anchor: <strong className="text-ink">{geofence.campusName}</strong>
            </span>
          </span>
          <span className="font-mono flex items-center gap-1">
            {formatCoordinates(geofence.latitude, geofence.longitude)} · {geofenceRadius}m radius
            <ExternalLink className="w-3 h-3 text-accent" />
          </span>
        </a>
      )}
    </div>
  );
}

export default LocationMap;
