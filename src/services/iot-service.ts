import { db } from '@/lib/firebase';
import {
    collection,
    getDocs,
    addDoc,
    query,
    where,
    orderBy,
    limit,
    Timestamp,
    doc,
    updateDoc
} from 'firebase/firestore';
import { IoTSensor, IoTReading, SensorStatus, SensorType, Department } from '@/lib/types';

/**
 * IoTService manages smart city sensor data including water level monitors,
 * air quality sensors, noise detectors, and infrastructure vibration sensors.
 */
export class IoTService {

    /**
     * Fetch all registered sensors.
     */
    async getSensors(): Promise<IoTSensor[]> {
        try {
            const sensorsQuery = query(collection(db, 'iot_sensors'), orderBy('name'));
            const snapshot = await getDocs(sensorsQuery);

            return snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    ...data,
                    id: doc.id,
                    lastReadingAt: data.lastReadingAt?.toDate?.() || new Date()
                } as IoTSensor;
            });
        } catch (error) {
            console.warn('[IoT] Failed to fetch sensors, returning demo data:', error);
            return this.getDemoSensors();
        }
    }

    /**
     * Fetch readings for a specific sensor within a time window.
     */
    async getReadings(sensorId: string, hours: number = 24): Promise<IoTReading[]> {
        try {
            const since = new Date(Date.now() - hours * 60 * 60 * 1000);
            const readingsQuery = query(
                collection(db, 'iot_readings'),
                where('sensorId', '==', sensorId),
                where('timestamp', '>=', Timestamp.fromDate(since)),
                orderBy('timestamp', 'desc'),
                limit(100)
            );
            const snapshot = await getDocs(readingsQuery);

            return snapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id,
                timestamp: doc.data().timestamp?.toDate?.() || new Date()
            } as IoTReading));
        } catch (error) {
            console.warn('[IoT] Failed to fetch readings:', error);
            return this.getDemoReadings(sensorId);
        }
    }

    /**
     * Ingest a new sensor reading and check thresholds.
     */
    async ingestReading(sensorId: string, value: number): Promise<{ alert: boolean; status: SensorStatus }> {
        const sensors = await this.getSensors();
        const sensor = sensors.find(s => s.id === sensorId);
        if (!sensor) throw new Error(`Sensor ${sensorId} not found`);

        const isAnomaly = value >= sensor.thresholds.critical;
        const newStatus: SensorStatus =
            value >= sensor.thresholds.critical ? 'critical' :
                value >= sensor.thresholds.warning ? 'warning' : 'online';

        // Store reading
        await addDoc(collection(db, 'iot_readings'), {
            sensorId,
            value,
            timestamp: Timestamp.now(),
            isAnomaly
        });

        // Update sensor status
        await updateDoc(doc(db, 'iot_sensors', sensorId), {
            lastReading: value,
            lastReadingAt: Timestamp.now(),
            status: newStatus
        });

        return { alert: isAnomaly, status: newStatus };
    }

    /**
     * Demo sensors for when Firestore collection doesn't exist yet.
     */
    private getDemoSensors(): IoTSensor[] {
        const now = new Date();
        return [
            {
                id: 'sensor_wl_01', name: 'Yamuna Water Level - ITO', type: 'water_level' as SensorType,
                location: { lat: 28.6280, lng: 77.2420, address: 'ITO Bridge, Delhi' },
                status: 'warning' as SensorStatus, lastReading: 78, lastReadingAt: now,
                thresholds: { warning: 70, critical: 90 }, unit: '%', department: 'water_supply' as Department
            },
            {
                id: 'sensor_aq_01', name: 'Air Quality - Connaught Place', type: 'air_quality' as SensorType,
                location: { lat: 28.6315, lng: 77.2167, address: 'Connaught Place, Delhi' },
                status: 'critical' as SensorStatus, lastReading: 312, lastReadingAt: now,
                thresholds: { warning: 200, critical: 300 }, unit: 'AQI', department: 'sanitation' as Department
            },
            {
                id: 'sensor_ns_01', name: 'Noise Level - Karol Bagh', type: 'noise' as SensorType,
                location: { lat: 28.6519, lng: 77.1905, address: 'Karol Bagh Market, Delhi' },
                status: 'online' as SensorStatus, lastReading: 62, lastReadingAt: now,
                thresholds: { warning: 75, critical: 90 }, unit: 'dB', department: 'sanitation' as Department
            },
            {
                id: 'sensor_vb_01', name: 'Road Vibration - Ring Road', type: 'vibration' as SensorType,
                location: { lat: 28.5845, lng: 77.2430, address: 'Ring Road, South Delhi' },
                status: 'online' as SensorStatus, lastReading: 3.2, lastReadingAt: now,
                thresholds: { warning: 5.0, critical: 8.0 }, unit: 'mm/s', department: 'roads_infrastructure' as Department
            },
            {
                id: 'sensor_tf_01', name: 'Traffic Flow - Rajpath', type: 'traffic_flow' as SensorType,
                location: { lat: 28.6129, lng: 77.2295, address: 'Rajpath, New Delhi' },
                status: 'online' as SensorStatus, lastReading: 1240, lastReadingAt: now,
                thresholds: { warning: 2000, critical: 3000 }, unit: 'veh/hr', department: 'roads_infrastructure' as Department
            },
            {
                id: 'sensor_tmp_01', name: 'Road Temp - NH-44', type: 'temperature' as SensorType,
                location: { lat: 28.7041, lng: 77.1025, address: 'NH-44, North Delhi' },
                status: 'warning' as SensorStatus, lastReading: 58, lastReadingAt: now,
                thresholds: { warning: 55, critical: 65 }, unit: '°C', department: 'roads_infrastructure' as Department
            }
        ];
    }

    /**
     * Demo readings for a sensor.
     */
    private getDemoReadings(sensorId: string): IoTReading[] {
        const readings: IoTReading[] = [];
        const now = Date.now();
        for (let i = 0; i < 24; i++) {
            readings.push({
                id: `reading_${sensorId}_${i}`,
                sensorId,
                value: Math.round((50 + Math.random() * 40 + Math.sin(i / 4) * 15) * 10) / 10,
                timestamp: new Date(now - i * 60 * 60 * 1000),
                isAnomaly: Math.random() > 0.9
            });
        }
        return readings;
    }
}

export const iotService = new IoTService();
