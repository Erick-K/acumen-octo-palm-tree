
import { useState, useEffect } from 'react';

interface GeolocationPosition {
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
}

interface GeolocationState {
  loading: boolean;
  error: GeolocationPositionError | null;
  position: GeolocationPosition | null;
}

export interface UseGeolocationOptions {
  /** When true, uses watchPosition for live updates (sales rep on the move). */
  watch?: boolean;
}

export const useGeolocation = (enabled: boolean, options?: UseGeolocationOptions) => {
  const watch = options?.watch ?? false;

  const [state, setState] = useState<GeolocationState>({
    loading: false,
    error: null,
    position: null,
  });

  useEffect(() => {
    if (!enabled) {
      setState({ loading: false, error: null, position: null });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    const geoOptions: PositionOptions = {
      enableHighAccuracy: true,
      maximumAge: 8000,
      timeout: 20000,
    };

    const onSuccess = (position: GeolocationPosition) => {
      setState({
        loading: false,
        error: null,
        position,
      });
    };

    const onError = (error: GeolocationPositionError) => {
      setState({
        loading: false,
        error,
        position: null,
      });
    };

    if (!navigator.geolocation) {
      setState({
        loading: false,
        error: {
          code: 0,
          message: 'Geolocation is not supported by your browser.',
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        } as GeolocationPositionError,
        position: null,
      });
      return;
    }

    let watchId: number | undefined;
    if (watch) {
      watchId = navigator.geolocation.watchPosition(onSuccess, onError, geoOptions);
    } else {
      navigator.geolocation.getCurrentPosition(onSuccess, onError, geoOptions);
    }

    return () => {
      if (watchId !== undefined) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [enabled, watch]);

  return state;
};
