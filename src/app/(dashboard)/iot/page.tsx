"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Activity,
    Wifi,
    WifiOff,
    AlertTriangle,
    Droplets,
    Wind,
    Volume2,
    Thermometer,
    Radio,
    Car
} from "lucide-react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { iotService } from "@/services/iot-service";
import { IoTSensor, IoTReading } from "@/lib/types";

const sensorIcons: Record<string, React.ReactNode> = {
    water_level: <Droplets className="h-5 w-5" />,
    air_quality: <Wind className="h-5 w-5" />,
    noise: <Volume2 className="h-5 w-5" />,
    temperature: <Thermometer className="h-5 w-5" />,
    vibration: <Radio className="h-5 w-5" />,
    traffic_flow: <Car className="h-5 w-5" />,
};

export default function IoTPage() {
    const [sensors, setSensors] = React.useState<IoTSensor[]>([]);
    const [selectedSensor, setSelectedSensor] = React.useState<IoTSensor | null>(null);
    const [readings, setReadings] = React.useState<IoTReading[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        loadSensors();
    }, []);

    const loadSensors = async () => {
        try {
            const data = await iotService.getSensors();
            setSensors(data);
            if (data.length > 0) {
                handleSelectSensor(data[0]);
            }
        } catch (error) {
            console.error("Failed to load sensors:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectSensor = async (sensor: IoTSensor) => {
        setSelectedSensor(sensor);
        try {
            const data = await iotService.getReadings(sensor.id, 24);
            setReadings(data);
        } catch (error) {
            console.error("Failed to load readings:", error);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "online": return "bg-emerald-500";
            case "warning": return "bg-yellow-500";
            case "critical": return "bg-red-500 animate-pulse";
            case "offline": return "bg-gray-500";
            default: return "bg-gray-500";
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "online": return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">Online</Badge>;
            case "warning": return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30">Warning</Badge>;
            case "critical": return <Badge className="bg-red-500/10 text-red-500 border-red-500/30 animate-pulse">Critical</Badge>;
            case "offline": return <Badge variant="secondary">Offline</Badge>;
            default: return <Badge variant="secondary">{status}</Badge>;
        }
    };

    // Stats
    const onlineCount = sensors.filter(s => s.status === "online").length;
    const warningCount = sensors.filter(s => s.status === "warning").length;
    const criticalCount = sensors.filter(s => s.status === "critical").length;

    // Chart data (reverse for chronological order)
    const chartData = readings
        .slice(0, 24)
        .reverse()
        .map(r => ({
            time: format(r.timestamp, "HH:mm"),
            value: r.value,
            anomaly: r.isAnomaly
        }));

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <Activity className="h-12 w-12 text-primary animate-pulse" />
                <p className="text-muted-foreground">Connecting to IoT sensors...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <Activity className="h-7 w-7 text-primary" />
                    IoT Sensor Network
                </h1>
                <p className="text-muted-foreground">
                    Real-time monitoring of smart city infrastructure sensors
                </p>
            </div>

            {/* Status Summary */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Wifi className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{sensors.length}</p>
                            <p className="text-xs text-muted-foreground">Total Sensors</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <Wifi className="h-5 w-5 text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-emerald-500">{onlineCount}</p>
                            <p className="text-xs text-muted-foreground">Online</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                            <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-yellow-500">{warningCount}</p>
                            <p className="text-xs text-muted-foreground">Warning</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                            <WifiOff className="h-5 w-5 text-red-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-red-500">{criticalCount}</p>
                            <p className="text-xs text-muted-foreground">Critical</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Sensor Grid */}
                <Card className="lg:col-span-1">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Sensor Network</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ScrollArea className="h-[450px]">
                            <div className="space-y-2 p-4 pt-0">
                                {sensors.map(sensor => (
                                    <div
                                        key={sensor.id}
                                        onClick={() => handleSelectSensor(sensor)}
                                        className={cn(
                                            "rounded-lg border p-3 cursor-pointer transition-all hover:shadow-md",
                                            selectedSensor?.id === sensor.id && "border-primary bg-primary/5",
                                            sensor.status === "critical" && "border-red-500/30"
                                        )}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className={cn("h-2.5 w-2.5 rounded-full", getStatusColor(sensor.status))} />
                                                <span className="text-muted-foreground">
                                                    {sensorIcons[sensor.type] || <Radio className="h-4 w-4" />}
                                                </span>
                                            </div>
                                            {getStatusBadge(sensor.status)}
                                        </div>
                                        <p className="font-medium text-sm">{sensor.name}</p>
                                        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                                            <span>{sensor.lastReading} {sensor.unit}</span>
                                            <span>{format(sensor.lastReadingAt, "HH:mm")}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Sensor Detail + Chart */}
                <Card className="lg:col-span-2">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            {selectedSensor ? (
                                <>
                                    {sensorIcons[selectedSensor.type]}
                                    {selectedSensor.name}
                                    {getStatusBadge(selectedSensor.status)}
                                </>
                            ) : "Select a sensor"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {selectedSensor && (
                            <div className="space-y-6">
                                {/* Current Reading */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="rounded-lg bg-muted/50 p-4 text-center">
                                        <p className="text-3xl font-bold">{selectedSensor.lastReading}</p>
                                        <p className="text-xs text-muted-foreground">{selectedSensor.unit} (Current)</p>
                                    </div>
                                    <div className="rounded-lg bg-yellow-500/10 p-4 text-center">
                                        <p className="text-3xl font-bold text-yellow-500">{selectedSensor.thresholds.warning}</p>
                                        <p className="text-xs text-muted-foreground">{selectedSensor.unit} (Warning)</p>
                                    </div>
                                    <div className="rounded-lg bg-red-500/10 p-4 text-center">
                                        <p className="text-3xl font-bold text-red-500">{selectedSensor.thresholds.critical}</p>
                                        <p className="text-xs text-muted-foreground">{selectedSensor.unit} (Critical)</p>
                                    </div>
                                </div>

                                {/* Time Series Chart */}
                                <div className="h-[280px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                            <XAxis dataKey="time" className="text-xs" />
                                            <YAxis className="text-xs" />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'hsl(var(--card))',
                                                    border: '1px solid hsl(var(--border))',
                                                    borderRadius: '8px'
                                                }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="value"
                                                stroke="hsl(var(--primary))"
                                                strokeWidth={2}
                                                dot={{ fill: 'hsl(var(--primary))', r: 3 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Location */}
                                <div className="text-sm text-muted-foreground">
                                    📍 {selectedSensor.location.address} ({selectedSensor.location.lat.toFixed(4)}, {selectedSensor.location.lng.toFixed(4)})
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
