/**
 * Leaflet map with live geofence circle overlay — tap-to-pin, draggable adjustment, or fixed preview.
 */
import { useEffect, useImperativeHandle, useMemo, useRef, forwardRef } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";

import { useThemeColors } from "@/hooks/useThemeColors";
import type { MapViewport } from "@/services/geocode";

export type GeofenceMapCenter = {
  latitude?: number;
  longitude?: number;
  zoom: number;
};

export type GeofenceMapViewHandle = {
  flyTo: (viewport: MapViewport) => void;
  setCenter: (latitude: number, longitude: number) => void;
  clearPin: () => void;
};

type GeofenceMapMode = "pindrop" | "adjustable" | "fixed";

type GeofenceMapViewProps = {
  mode: GeofenceMapMode;
  viewport: MapViewport;
  /** Adjustable/fixed/pindrop center once a pin exists. */
  center?: { latitude: number; longitude: number } | null;
  radiusMeters: number;
  onCenterChange?: (center: GeofenceMapCenter) => void;
  height?: number | "flex";
  mapKey?: number;
  loading?: boolean;
};

type MapMessagePayload = {
  type?: string;
  latitude?: number;
  longitude?: number;
  zoom?: number;
};

function buildGeofenceMapHtml(
  viewport: MapViewport,
  mode: GeofenceMapMode,
  fixedLat: number | null,
  fixedLng: number | null,
  initialRadius: number,
): string {
  const { latitude, longitude, zoom } = viewport;
  const isPindrop = mode === "pindrop";
  const isAdjustable = mode === "adjustable";
  const isPannable = isPindrop || isAdjustable;
  const hasInitialPin = (isPindrop || isAdjustable) && fixedLat != null && fixedLng != null;
  const hint = isPindrop
    ? hasInitialPin
      ? "Drag the circle to fine-tune your geofence."
      : "Tap the building to drop a pin."
    : isAdjustable
      ? "Drag the circle to fine-tune your geofence."
      : "Circle shows how much of the venue is covered.";

  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; }
    body { overflow: hidden; -webkit-user-select: none; user-select: none; }
    #map, .leaflet-container { touch-action: none; }
    .map-wrap { position: relative; height: 100%; }
    .hint {
      position: absolute; z-index: 1000; left: 12px; right: 12px; top: 12px;
      background: rgba(252,252,248,0.95); color: #1A1A1A; padding: 10px 12px;
      border-radius: 10px; font-family: sans-serif; font-size: 13px; line-height: 1.35;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15); pointer-events: none;
    }
    .geofence-handle {
      background: #FF7700;
      border: 2px solid #FCFCF8;
      border-radius: 50%;
      width: 18px;
      height: 18px;
      margin-left: -9px;
      margin-top: -9px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.25);
    }
    .venue-pin {
      background: #0D132B;
      border: 2px solid #F0EDE9;
      border-radius: 50%;
      width: 14px;
      height: 14px;
      margin-left: -7px;
      margin-top: -7px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.25);
    }
  </style>
</head>
<body>
  <div class="map-wrap">
    <div class="hint" id="map-hint">${hint}</div>
    <div id="map"></div>
  </div>
  <script>
    var mapMode = '${mode}';
    var isPindrop = mapMode === 'pindrop';
    var isAdjustable = mapMode === 'adjustable';
    var hasPin = ${hasInitialPin ? "true" : "false"};
    var fixedLat = ${fixedLat ?? "null"};
    var fixedLng = ${fixedLng ?? "null"};
    var currentRadius = ${initialRadius};
    var geofenceCircle = null;
    var centerMarker = null;
    var hintEl = document.getElementById('map-hint');

    var map = L.map('map', {
      zoomControl: false,
      dragging: ${isPannable ? "true" : "false"},
      scrollWheelZoom: false,
      doubleClickZoom: ${isPannable ? "true" : "false"},
      touchZoom: ${isPannable ? "true" : "false"},
      tap: false,
      bounceAtZoomLimits: false,
      zoomAnimation: true,
      fadeAnimation: true,
      markerZoomAnimation: true,
      zoomSnap: 0,
      zoomDelta: 0.5
    }).setView([${latitude}, ${longitude}], ${zoom});

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    function updateHint() {
      if (!hintEl) return;
      if (isPindrop) {
        hintEl.textContent = hasPin
          ? 'Drag the circle to fine-tune your geofence.'
          : 'Tap the building to drop a pin.';
      }
    }

    function getCircleCenter() {
      if ((isAdjustable || isPindrop) && centerMarker) {
        var pos = centerMarker.getLatLng();
        return { lat: pos.lat, lng: pos.lng };
      }
      if (!isPindrop && fixedLat != null && fixedLng != null) {
        return { lat: fixedLat, lng: fixedLng };
      }
      var center = map.getCenter();
      return { lat: center.lat, lng: center.lng };
    }

    function updateGeofenceCircle() {
      if (!hasPin && isPindrop) {
        if (geofenceCircle) {
          map.removeLayer(geofenceCircle);
          geofenceCircle = null;
        }
        return;
      }

      var c = getCircleCenter();
      if (geofenceCircle) {
        geofenceCircle.setLatLng([c.lat, c.lng]);
        geofenceCircle.setRadius(currentRadius);
        return;
      }
      geofenceCircle = L.circle([c.lat, c.lng], {
        radius: currentRadius,
        color: '#FF7700',
        weight: 2,
        fillColor: '#FF7700',
        fillOpacity: 0.15
      }).addTo(map);
    }

    function emitCenter() {
      if (isPindrop && !hasPin) return;
      var c = getCircleCenter();
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'center',
          latitude: c.lat,
          longitude: c.lng,
          zoom: map.getZoom()
        }));
      }
    }

    function createDraggableMarker(lat, lng) {
      if (centerMarker) {
        centerMarker.setLatLng([lat, lng]);
        return;
      }
      centerMarker = L.marker([lat, lng], {
        draggable: true,
        icon: L.divIcon({
          className: 'geofence-handle-wrap',
          html: '<div class="geofence-handle"></div>',
          iconSize: [18, 18],
          iconAnchor: [9, 9]
        })
      }).addTo(map);
      centerMarker.on('drag', updateGeofenceCircle);
      centerMarker.on('dragend', emitCenter);
    }

    function placePin(lat, lng) {
      hasPin = true;
      fixedLat = lat;
      fixedLng = lng;
      createDraggableMarker(lat, lng);
      updateGeofenceCircle();
      updateHint();
      emitCenter();
    }

    window.setGeofenceRadius = function (meters) {
      currentRadius = meters;
      updateGeofenceCircle();
    };

    window.setFixedCenter = function (lat, lng) {
      if (isPindrop && !hasPin) {
        placePin(lat, lng);
        return;
      }
      fixedLat = lat;
      fixedLng = lng;
      if (centerMarker) {
        centerMarker.setLatLng([lat, lng]);
      }
      updateGeofenceCircle();
    };

    window.clearPin = function () {
      hasPin = false;
      fixedLat = null;
      fixedLng = null;
      if (centerMarker) {
        map.removeLayer(centerMarker);
        centerMarker = null;
      }
      updateGeofenceCircle();
      updateHint();
    };

    window.flyToMap = function (lat, lng, zoomLevel) {
      var z = typeof zoomLevel === 'number' ? zoomLevel : map.getZoom();
      map.setView([lat, lng], z);
    };

    if (isPindrop) {
      map.on('click', function (e) {
        placePin(e.latlng.lat, e.latlng.lng);
      });
      if (hasInitialPin) {
        createDraggableMarker(fixedLat, fixedLng);
        updateGeofenceCircle();
      }
    } else if (isAdjustable && fixedLat != null && fixedLng != null) {
      createDraggableMarker(fixedLat, fixedLng);
      updateGeofenceCircle();
    } else if (!isPindrop) {
      map.whenReady(function () {
        updateGeofenceCircle();
        emitCenter();
      });
    }

    function emitZoom() {
      if (isPindrop && !hasPin) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'zoom',
            zoom: map.getZoom()
          }));
        }
        return;
      }
      emitCenter();
    }

    map.whenReady(function () {
      map.invalidateSize();
      setTimeout(function () { map.invalidateSize(); }, 120);
    });

    map.on('zoomend', emitZoom);
    updateHint();
  </script>
</body>
</html>`;
}

export const GeofenceMapView = forwardRef<GeofenceMapViewHandle, GeofenceMapViewProps>(
  function GeofenceMapView(
    {
      mode,
      viewport,
      center,
      radiusMeters,
      onCenterChange,
      height = "flex",
      mapKey = 0,
      loading = false,
    },
    ref,
  ) {
    const colors = useThemeColors();
    const webViewRef = useRef<WebView>(null);

    const html = useMemo(
      () =>
        buildGeofenceMapHtml(
          viewport,
          mode,
          center?.latitude ?? null,
          center?.longitude ?? null,
          radiusMeters,
        ),
      [mode, mapKey],
    );

    useImperativeHandle(ref, () => ({
      flyTo: (nextViewport: MapViewport) => {
        webViewRef.current?.injectJavaScript(
          `window.flyToMap(${nextViewport.latitude}, ${nextViewport.longitude}, ${nextViewport.zoom}); true;`,
        );
      },
      setCenter: (latitude: number, longitude: number) => {
        webViewRef.current?.injectJavaScript(
          `window.setFixedCenter(${latitude}, ${longitude}); true;`,
        );
      },
      clearPin: () => {
        webViewRef.current?.injectJavaScript(`window.clearPin(); true;`);
      },
    }));

    useEffect(() => {
      webViewRef.current?.injectJavaScript(
        `window.setGeofenceRadius(${radiusMeters}); true;`,
      );
    }, [radiusMeters, mapKey]);

    useEffect(() => {
      if (!center) return;
      webViewRef.current?.injectJavaScript(
        `window.setFixedCenter(${center.latitude}, ${center.longitude}); true;`,
      );
    }, [center?.latitude, center?.longitude, mode, mapKey]);

    const handleMessage = (event: WebViewMessageEvent) => {
      if (!onCenterChange) return;
      try {
        const payload = JSON.parse(event.nativeEvent.data) as MapMessagePayload;
        if (payload.type === "zoom" && typeof payload.zoom === "number") {
          onCenterChange({ zoom: payload.zoom });
          return;
        }
        if (
          payload.type === "center" &&
          typeof payload.latitude === "number" &&
          typeof payload.longitude === "number" &&
          typeof payload.zoom === "number"
        ) {
          onCenterChange({
            latitude: payload.latitude,
            longitude: payload.longitude,
            zoom: payload.zoom,
          });
        }
      } catch {
        // Ignore malformed map messages.
      }
    };

    if (loading) {
      return (
        <View
          style={{
            height: height === "flex" ? undefined : height,
            flex: height === "flex" ? 1 : undefined,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.border,
            borderRadius: 14,
          }}
        >
          <ActivityIndicator color={colors.primary} />
        </View>
      );
    }

    return (
      <View
        collapsable={false}
        style={{
          height: height === "flex" ? undefined : height,
          flex: height === "flex" ? 1 : undefined,
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        <WebView
          key={mapKey}
          ref={webViewRef}
          originWhitelist={["*"]}
          source={{ html }}
          onMessage={handleMessage}
          style={{ flex: 1, backgroundColor: "transparent" }}
          javaScriptEnabled
          domStorageEnabled
          scrollEnabled={false}
          bounces={false}
          overScrollMode="never"
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          textInteractionEnabled={false}
          setSupportMultipleWindows={false}
          {...(Platform.OS === "android" ? { androidLayerType: "hardware" as const } : {})}
        />
      </View>
    );
  },
);
