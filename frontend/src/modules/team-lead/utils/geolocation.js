const HIGH_ACCURACY_OPTIONS = { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 };
const RETRY_OPTIONS = { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 };
const LOCATION_GUIDANCE = 'Enable Windows Location Services and location access for the desktop app, allow Location for localhost in your browser settings, and open this app at http://localhost or over HTTPS.';

const requestPosition = options => new Promise((resolve, reject) => {
  navigator.geolocation.getCurrentPosition(resolve, reject, options);
});

const getFailureMessage = error => {
  if (error.code === error.PERMISSION_DENIED) {
    return `Device location permission is required to record attendance. Allow location access. ${LOCATION_GUIDANCE}`;
  }
  if (error.code === error.POSITION_UNAVAILABLE) {
    return `Device location is unavailable after retry. ${LOCATION_GUIDANCE}`;
  }
  if (error.code === error.TIMEOUT) {
    return `Device location request timed out after retry. ${LOCATION_GUIDANCE}`;
  }
  return `Device location could not be retrieved. Location permission is required to record attendance. ${LOCATION_GUIDANCE}`;
};

export const captureDeviceLocation = async () => {
  if (typeof window !== 'undefined' && window.isSecureContext === false) {
    throw new Error(`Device location permission is required to record attendance. ${LOCATION_GUIDANCE}`);
  }

  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    throw new Error(`Device location is unsupported in this browser. ${LOCATION_GUIDANCE}`);
  }

  let position;
  try {
    position = await requestPosition(HIGH_ACCURACY_OPTIONS);
  } catch (error) {
    console.warn('Geolocation attempt failed:', error.code, error.message);
    const shouldRetry = error.code === error.POSITION_UNAVAILABLE || error.code === error.TIMEOUT;
    if (!shouldRetry) throw new Error(getFailureMessage(error));

    try {
      position = await requestPosition(RETRY_OPTIONS);
    } catch (retryError) {
      console.warn('Geolocation retry failed:', retryError.code, retryError.message);
      throw new Error(getFailureMessage(retryError));
    }
  }

  const { coords } = position;
  return {
      lat: coords.latitude,
      lng: coords.longitude,
      accuracy: coords.accuracy,
      capturedAt: new Date().toISOString(),
      address: null,
  };
};
