"use client";

import React from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Icon, LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import { Ticket } from "@/lib/types";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

// Fix for default marker icons in Leaflet
if (typeof window !== 'undefined') {
    delete (Icon.Default.prototype as any)._getIconUrl;
    Icon.Default.mergeOptions({
        iconRetinaUrl: '/marker-icon-2x.png',
        iconUrl: '/marker-icon.png',
        shadowUrl: '/marker-shadow.png',
    });
}

// Component to auto-fit bounds to show all markers
function FitBounds({ positions }: { positions: LatLngExpression[] }) {
    const map = useMap();

    React.useEffect(() => {
        if (positions.length > 0) {
            const bounds = positions.map(pos => pos as [number, number]);
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
        }
    }, [positions, map]);

    return null;
}

// Custom marker icon based on priority/SLA
function getMarkerColor(ticket: Ticket): string {
    if (ticket.slaStage === 'breached') return '#ef4444'; // red
    if (ticket.priorityScore >= 80) return '#ef4444'; // red
    if (ticket.priorityScore >= 60) return '#f59e0b'; // amber
    if (ticket.slaStage === 'at_risk') return '#f59e0b'; // amber
    return '#10b981'; // green
}

function createCustomIcon(ticket: Ticket) {
    const color = getMarkerColor(ticket);
    const svgIcon = `
        <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 9.4 12.5 28.5 12.5 28.5S25 21.9 25 12.5C25 5.6 19.4 0 12.5 0z" 
                  fill="${color}" stroke="#fff" stroke-width="2"/>
            <circle cx="12.5" cy="12.5" r="6" fill="#fff"/>
        </svg>
    `;

    return new Icon({
        iconUrl: `data:image/svg+xml;base64,${btoa(svgIcon)}`,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
    });
}

interface TicketsMapProps {
    tickets: Ticket[];
    className?: string;
}

export function TicketsMap({ tickets, className }: TicketsMapProps) {
    const defaultCenter: LatLngExpression = [28.6139, 77.2090]; // Delhi
    const positions = tickets.map(t => [t.location.lat, t.location.lng] as LatLngExpression);

    return (
        <div className={cn("w-full h-full min-h-[400px] rounded-lg overflow-hidden", className)}>
            <MapContainer
                center={defaultCenter}
                zoom={11}
                className="w-full h-full"
                zoomControl={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {positions.length > 0 && <FitBounds positions={positions} />}

                {tickets.map((ticket) => (
                    <Marker
                        key={ticket.id}
                        position={[ticket.location.lat, ticket.location.lng]}
                        icon={createCustomIcon(ticket)}
                    >
                        <Popup>
                            <div className="p-2 min-w-[200px]">
                                <Link
                                    href={`/tickets/${ticket.id}`}
                                    className="font-semibold text-primary hover:underline"
                                >
                                    #{ticket.ticketNumber}
                                </Link>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {ticket.type}
                                </p>
                                <div className="mt-2 space-y-1">
                                    <Badge
                                        variant={
                                            ticket.priorityScore >= 80 ? "destructive" :
                                                ticket.priorityScore >= 60 ? "default" :
                                                    "secondary"
                                        }
                                        className="text-xs"
                                    >
                                        Priority: {ticket.priorityScore}
                                    </Badge>
                                    <p className="text-xs text-muted-foreground">
                                        {ticket.location.ward}
                                    </p>
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                        {ticket.description}
                                    </p>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
