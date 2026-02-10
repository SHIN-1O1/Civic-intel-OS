import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseToken, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * POST /api/iot - Ingest IoT sensor reading
 *
 * Expected body:
 * {
 *   sensorId: string,
 *   value: number,
 *   type?: string,
 *   location?: { lat: number, lng: number, address: string }
 * }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { sensorId, value, type, location } = body;

        // Validate required fields
        if (!sensorId || value === undefined || value === null) {
            return NextResponse.json(
                { error: 'Missing required fields: sensorId, value' },
                { status: 400 }
            );
        }

        if (typeof value !== 'number' || isNaN(value)) {
            return NextResponse.json(
                { error: 'Value must be a valid number' },
                { status: 400 }
            );
        }

        const db = adminDb();

        // Check if sensor exists (optional: auto-register)
        const sensorRef = db.collection('iot_sensors').doc(sensorId);
        const sensorDoc = await sensorRef.get();

        let alert = false;
        let sensorStatus = 'online';

        if (sensorDoc.exists) {
            const sensor = sensorDoc.data()!;
            const thresholds = sensor.thresholds || { warning: 70, critical: 90 };

            // Determine status based on thresholds
            if (value >= thresholds.critical) {
                sensorStatus = 'critical';
                alert = true;
            } else if (value >= thresholds.warning) {
                sensorStatus = 'warning';
            }

            // Update sensor with latest reading
            await sensorRef.update({
                lastReading: value,
                lastReadingAt: FieldValue.serverTimestamp(),
                status: sensorStatus
            });
        } else {
            // Auto-register new sensor
            await sensorRef.set({
                name: `Sensor ${sensorId}`,
                type: type || 'unknown',
                location: location || { lat: 28.6139, lng: 77.2090, address: 'Unknown' },
                status: 'online',
                lastReading: value,
                lastReadingAt: FieldValue.serverTimestamp(),
                thresholds: { warning: 70, critical: 90 },
                unit: '',
                department: 'roads_infrastructure'
            });
        }

        // Store reading
        await db.collection('iot_readings').add({
            sensorId,
            value,
            timestamp: FieldValue.serverTimestamp(),
            isAnomaly: alert
        });

        return NextResponse.json({
            success: true,
            sensorId,
            value,
            status: sensorStatus,
            alert,
            message: alert ? 'ALERT: Reading exceeds critical threshold!' : 'Reading ingested successfully'
        });

    } catch (error) {
        console.error('[IoT API] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/iot - Get sensor data
 * Optional query params: sensorId, type
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const sensorId = searchParams.get('sensorId');
        const db = adminDb();

        if (sensorId) {
            // Get specific sensor readings
            const readingsSnapshot = await db
                .collection('iot_readings')
                .where('sensorId', '==', sensorId)
                .orderBy('timestamp', 'desc')
                .limit(50)
                .get();

            const readings = readingsSnapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({
                id: doc.id,
                ...doc.data()
            }));

            return NextResponse.json({ readings });
        }

        // Get all sensors
        const sensorsSnapshot = await db
            .collection('iot_sensors')
            .orderBy('name')
            .get();

        const sensors = sensorsSnapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({
            id: doc.id,
            ...doc.data()
        }));

        return NextResponse.json({ sensors });

    } catch (error) {
        console.error('[IoT API] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
