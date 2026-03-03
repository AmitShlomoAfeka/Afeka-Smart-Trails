'use client';
import { useState, useEffect } from 'react';
import api from '../../lib/api';
import Link from 'next/link';

export default function History() {
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [weatherData, setWeatherData] = useState({});

    useEffect(() => {
        const fetchTripsAndWeather = async () => {
            try {
                const res = await api.get('/trips/history');
                const loadedTrips = res.data;
                setTrips(loadedTrips);

                // Fetch real weather for each trip dynamically for tomorrow
                loadedTrips.forEach(async (trip) => {
                    try {
                        const coords = trip.routeData?.features?.[0]?.geometry?.coordinates;
                        if (coords && coords.length > 0) {
                            const [lon, lat] = coords[0]; // OSRM coords are [lon, lat]
                            const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&forecast_days=2`);
                            const weatherJson = await weatherRes.json();

                            // Get tomorrow's forecast (index 1)
                            setWeatherData(prev => ({
                                ...prev,
                                [trip._id]: `Tomorrow: ${weatherJson.daily.temperature_2m_min[1]}°C - ${weatherJson.daily.temperature_2m_max[1]}°C`
                            }));
                        }
                    } catch (e) {
                        console.error('Weather fetch error for trip', trip._id, e);
                    }
                });

            } catch (err) {
                console.error('Failed to fetch history', err);
            } finally {
                setLoading(false);
            }
        };
        fetchTripsAndWeather();
    }, []);

    if (loading) return <div className="text-center mt-10">Loading history...</div>;

    return (
        <div className="max-w-4xl mx-auto p-4">
            <h2 className="text-3xl font-bold mb-6 text-center text-green-700">My Trips History</h2>

            {trips.length === 0 ? (
                <div className="text-center text-gray-900">
                    <p>No trips found.</p>
                    <Link href="/plan" className="text-green-600 underline">Plan your first trip!</Link>
                </div>
            ) : (
                <div className="grid gap-4">
                    {trips.map((trip) => (
                        <Link
                            href={`/history/${trip._id}`}
                            key={trip._id}
                            className="bg-white p-4 rounded shadow border border-gray-200 hover:shadow-lg hover:border-green-400 cursor-pointer block transition group"
                        >
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-xl font-bold group-hover:text-green-700 transition">{trip.title}</h3>
                                <span className="text-sm text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded">
                                    {new Date(trip.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            <p className="text-gray-700 font-medium mb-3">
                                <span className="capitalize">{trip.type}</span> • {trip.duration} days • {trip.totalDistanceKm || '?'} km
                            </p>

                            <div className="mt-2 bg-blue-50 border border-blue-100 p-3 rounded text-sm text-blue-900">
                                <strong className="flex items-center gap-1 mb-1">🌤️ Forecast Snippet: </strong>
                                {weatherData[trip._id] || "Loading weather..."}
                            </div>
                            <div className="mt-4 text-right">
                                <span className="text-sm font-bold text-green-600 group-hover:underline">View Map & Details &rarr;</span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
