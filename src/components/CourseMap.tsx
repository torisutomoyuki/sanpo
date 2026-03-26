"use client";

import {
  APIProvider,
  AdvancedMarker,
  Map,
  Marker,
  Pin,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";
import { useEffect, useRef, useState } from "react";
import type { Spot } from "@/lib/types";

const DEFAULT_CENTER = { lat: 32.7503, lng: 129.8779 };

function DirectionsRoute({ spots }: { spots: Spot[] }) {
  const map = useMap();
  const rendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map || spots.length < 2) return;

    rendererRef.current?.setMap(null);
    polylineRef.current?.setMap(null);

    const origin = { lat: spots[0].lat, lng: spots[0].lng };
    const destination = {
      lat: spots[spots.length - 1].lat,
      lng: spots[spots.length - 1].lng,
    };
    const waypoints = spots.slice(1, -1).map((s) => ({
      location: { lat: s.lat, lng: s.lng },
      stopover: true,
    }));

    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer({
      map,
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: "#ea580c",
        strokeOpacity: 0.8,
        strokeWeight: 4,
      },
    });
    rendererRef.current = directionsRenderer;

    directionsService.route(
      {
        origin,
        destination,
        waypoints,
        travelMode: google.maps.TravelMode.WALKING,
        optimizeWaypoints: false,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          directionsRenderer.setDirections(result);
        } else {
          const path = spots.map((s) => ({ lat: s.lat, lng: s.lng }));
          const polyline = new google.maps.Polyline({
            path,
            strokeColor: "#ea580c",
            strokeOpacity: 0.6,
            strokeWeight: 3,
            geodesic: true,
            map,
          });
          polylineRef.current = polyline;
        }
      }
    );

    return () => {
      rendererRef.current?.setMap(null);
      rendererRef.current = null;
      polylineRef.current?.setMap(null);
      polylineRef.current = null;
    };
  }, [map, spots]);

  return null;
}

function MapClickHandler({
  onClick,
}: {
  onClick: (lat: number, lng: number) => void;
}) {
  const map = useMap();
  const onClickRef = useRef(onClick);
  onClickRef.current = onClick;

  useEffect(() => {
    if (!map) return;

    const listener = map.addListener(
      "click",
      (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          onClickRef.current(e.latLng.lat(), e.latLng.lng());
        }
      }
    );

    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [map]);

  return null;
}

function PlacesSearchBar() {
  const map = useMap();
  const placesLib = useMapsLibrary("places");
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (!placesLib || !inputRef.current || !map) return;

    const autocomplete = new placesLib.Autocomplete(inputRef.current, {
      fields: ["geometry", "name"],
      types: ["establishment", "geocode"],
    });
    autocompleteRef.current = autocomplete;

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (place.geometry?.location) {
        map.panTo(place.geometry.location);
        map.setZoom(16);
      }
    });

    return () => {
      google.maps.event.clearInstanceListeners(autocomplete);
    };
  }, [placesLib, map]);

  return (
    <div className="absolute top-3 left-3 right-3 z-10">
      <input
        ref={inputRef}
        type="text"
        placeholder="住所・スポット名で検索"
        className="w-full bg-white shadow-md rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 border-0"
      />
    </div>
  );
}

function MapCenterUpdater({
  center,
}: {
  center: { lat: number; lng: number };
}) {
  const map = useMap();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!map || initializedRef.current) return;
    initializedRef.current = true;
    map.panTo(center);
  }, [map, center]);

  return null;
}

type PendingSpot = { lat: number; lng: number };

type CourseMapProps = {
  spots: Spot[];
  pendingSpot?: PendingSpot | null;
  center?: { lat: number; lng: number };
  className?: string;
  onMapClick?: (lat: number, lng: number) => void;
  interactive?: boolean;
  showSearch?: boolean;
};

export default function CourseMap({
  spots,
  pendingSpot,
  center,
  className = "w-full h-64",
  onMapClick,
  interactive = false,
  showSearch = false,
}: CourseMapProps) {
  const defaultCenter =
    spots.length > 0
      ? { lat: spots[0].lat, lng: spots[0].lng }
      : DEFAULT_CENTER;

  return (
    <APIProvider
      apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
      libraries={showSearch ? ["places"] : []}
    >
      <div className={`relative ${className}`}>
        <Map
          defaultCenter={defaultCenter}
          defaultZoom={14}
          gestureHandling="greedy"
          disableDefaultUI={!interactive}
          mapId="mappo-map"
        >
          {center && <MapCenterUpdater center={center} />}
          {onMapClick && <MapClickHandler onClick={onMapClick} />}
          {spots.map((spot, i) => (
            <Marker
              key={spot.id || i}
              position={{ lat: spot.lat, lng: spot.lng }}
              label={`${i + 1}`}
              title={spot.title}
            />
          ))}
          {pendingSpot && (
            <AdvancedMarker
              position={{ lat: pendingSpot.lat, lng: pendingSpot.lng }}
            >
              <Pin
                background="#f97316"
                borderColor="#c2410c"
                glyphColor="#fff"
                scale={1.2}
              />
            </AdvancedMarker>
          )}
          <DirectionsRoute spots={spots} />
          {showSearch && <PlacesSearchBar />}
        </Map>
      </div>
    </APIProvider>
  );
}
