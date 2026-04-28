
import { useState, useEffect } from 'react';

interface GeolocationPosition {
  coords: {
    latitude: number;
    longitude: number;
  };
}

interface GeolocationState {
  loading: boolean;
  error: GeolocationPositionError | null;
  position: GeolocationPosition | null;
}

export const useGeolocation = (enabled: boolean = true) => {
  const [state, setState] = useState<GeolocationState>({
    loading: false,
    error: null,
    position: null,
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

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
      // Not a real error object, but indicates lack of support
      setState({
        loading: false,
        error: {
            code: 0,
            message: 'Geolocation is not supported by your browser.',
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3,
        } as any,
        position: null,
      });
    } else {
      navigator.geolocation.getCurrentPosition(onSuccess, onError);
    }
  }, [enabled]);

  return state;
};
