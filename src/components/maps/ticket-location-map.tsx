"use client";

import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons
if (typeof window !== 'undefined') {
    delete (Icon.Default.prototype as any)._getIconUrl;
    Icon.Default.mergeOptions({
        iconRetinaUrl: '/marker-icon-2x.png',
        iconUrl: '/marker-icon.png',
        shadowUrl: '/marker-shadow.png',
    });
}

interface TicketLocationMapProps {
    lat: number;
    lng: number;
    address: string;
    ward: string;
    className?: string;
}

export function TicketLocationMap({ lat, lng, address, ward, className }: TicketLocationMapProps) {
    return (
        <div className={className}>
            <MapContainer
                center={[lat, lng]}
                zoom={15}
                className="w-full h-full rounded-lg"
                zoomControl={true}
                scrollWheelZoom={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <Marker position={[lat, lng]}>
                    <Popup>
                        <div className="p-2">
                            <p className="font-semibold">{ward}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                {address}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                                {lat.toFixed(6)}, {lng.toFixed(6)}
                            </p>
                        </div>
                    </Popup>
                </Marker>
            </MapContainer>
        </div>
    );
}
