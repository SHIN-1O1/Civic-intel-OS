"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Skeleton } from "@/components/ui/skeleton";
import {
    MapPin,
    Layers,
    Construction,
    Trash2,
    Droplets,
    Maximize2,
    RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

// Dynamically import map to avoid SSR issues
const MapContainer = dynamic(
    () => import("react-leaflet").then((mod) => mod.MapContainer),
    { ssr: false }
);
const TileLayer = dynamic(
    () => import("react-leaflet").then((mod) => mod.TileLayer),
    { ssr: false }
);
const CircleMarker = dynamic(
    () => import("react-leaflet").then((mod) => mod.CircleMarker),
    { ssr: false }
);
const Popup = dynamic(
    () => import("react-leaflet").then((mod) => mod.Popup),
    { ssr: false }
);

interface HeatmapPoint {
    lat: number;
    lng: number;
    type: "pothole" | "garbage" | "water";
    intensity: number;
    ward: string;
    count: number;
}

// Mock heatmap data
const heatmapData: HeatmapPoint[] = [
    { lat: 12.9716, lng: 77.5946, type: "pothole", intensity: 0.9, ward: "Ward 4 - Central", count: 8 },
    { lat: 12.9766, lng: 77.5993, type: "garbage", intensity: 0.7, ward: "Ward 7 - Market District", count: 5 },
    { lat: 12.9650, lng: 77.5850, type: "pothole", intensity: 0.5, ward: "Ward 2 - Residential North", count: 3 },
    { lat: 12.9800, lng: 77.6100, type: "water", intensity: 0.95, ward: "Ward 5 - Industrial", count: 6 },
    { lat: 12.9700, lng: 77.5900, type: "garbage", intensity: 0.4, ward: "Ward 3 - Green Belt", count: 2 },
    { lat: 12.9750, lng: 77.6050, type: "water", intensity: 0.6, ward: "Ward 6 - Commercial", count: 4 },
    { lat: 12.9680, lng: 77.5980, type: "pothole", intensity: 0.8, ward: "Ward 4 - Central", count: 7 },
    { lat: 12.9720, lng: 77.6020, type: "garbage", intensity: 0.65, ward: "Ward 6 - Commercial", count: 4 },
];

const layerConfig = {
    pothole: {
        label: "Potholes",
        icon: Construction,
        color: "#ef4444" // Signal Red
    },
    garbage: {
        label: "Garbage",
        icon: Trash2,
        color: "#f59e0b" // Amber
    },
    water: {
        label: "Water",
        icon: Droplets,
        color: "#3b82f6" // Govt Blue
    },
};

export function Heatmap() {
    const [activeLayers, setActiveLayers] = React.useState<Set<string>>(
        new Set(["pothole", "garbage", "water"])
    );
    const [isLoading, setIsLoading] = React.useState(true);
    const [mapReady, setMapReady] = React.useState(false);

    React.useEffect(() => {
        // Simulate loading and set map ready
        const timer = setTimeout(() => {
            setIsLoading(false);
            setMapReady(true);
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    const toggleLayer = (layer: string) => {
        const newLayers = new Set(activeLayers);
        if (newLayers.has(layer)) {
            newLayers.delete(layer);
        } else {
            newLayers.add(layer);
        }
        setActiveLayers(newLayers);
    };

    const filteredData = heatmapData.filter((point) =>
        activeLayers.has(point.type)
    );

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        Issue Heatmap
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Maximize2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                {/* Layer toggles */}
                <div className="flex items-center gap-2 pt-2">
                    <Layers className="h-4 w-4 text-muted-foreground" />
                    {Object.entries(layerConfig).map(([key, config]) => {
                        const Icon = config.icon;
                        return (
                            <Toggle
                                key={key}
                                size="sm"
                                pressed={activeLayers.has(key)}
                                onPressedChange={() => toggleLayer(key)}
                                className={cn(
                                    "gap-1.5 data-[state=on]:bg-opacity-100",
                                    activeLayers.has(key) && "border-2"
                                )}
                                style={{
                                    borderColor: activeLayers.has(key) ? config.color : undefined,
                                    color: activeLayers.has(key) ? config.color : undefined,
                                }}
                            >
                                <Icon className="h-3.5 w-3.5" />
                                <span className="text-xs">{config.label}</span>
                            </Toggle>
                        );
                    })}
                </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 relative min-h-[400px]">
                {isLoading ? (
                    <Skeleton className="absolute inset-0 m-4 rounded-lg" />
                ) : (
                    <div className="absolute inset-0 m-4 rounded-lg overflow-hidden border border-border">
                        {mapReady && typeof window !== "undefined" && (
                            <MapContainer
                                center={[12.9716, 77.5946]}
                                zoom={13}
                                className="h-full w-full"
                                zoomControl={true}
                            >
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                {filteredData.map((point, index) => (
                                    <CircleMarker
                                        key={`${point.type}-${index}`}
                                        center={[point.lat, point.lng]}
                                        radius={point.intensity * 25}
                                        fillColor={layerConfig[point.type].color}
                                        fillOpacity={0.6}
                                        color={layerConfig[point.type].color}
                                        weight={2}
                                    >
                                        <Popup>
                                            <div className="p-1">
                                                <p className="font-semibold">{point.ward}</p>
                                                <p className="text-sm text-muted-foreground capitalize">
                                                    {point.type}: {point.count} reports
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Activity Level: {(point.intensity * 100).toFixed(0)}%
                                                </p>
                                            </div>
                                        </Popup>
                                    </CircleMarker>
                                ))}
                            </MapContainer>
                        )}
                    </div>
                )}

                {/* Legend */}
                <div className="absolute bottom-6 left-6 z-[1000] rounded-lg bg-background/90 backdrop-blur p-3 border border-border">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Activity Level</p>
                    <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-[var(--emerald-success)]"></span>
                            Low
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-[var(--amber-warning)]"></span>
                            Medium
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-[var(--signal-red)]"></span>
                            High
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
