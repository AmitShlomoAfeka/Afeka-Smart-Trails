'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import api from '../../../lib/api';

const Map = dynamic(() => import('../../../components/Map'), {
    ssr: false,
    loading: () => <div className="h-96 w-full flex items-center justify-center bg-gray-100">Loading Map...</div>
});

export default function TripDetails() {
    const { id } = useParams();
    const router = useRouter();
    const [trip, setTrip] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchTrip = async () => {
            try {
                const res = await api.get(`/trips/history/${id}`);
                setTrip(res.data);
            } catch (err) {
                console.error('Failed to fetch trip details:', err);
                setError('Could not load trip details. It may have been deleted or you do not have permission to view it.');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchTrip();
        }
    }, [id]);

    if (loading) return <div className="text-center mt-10 text-xl font-bold">Loading Trip Details...</div>;

    if (error || !trip) {
        return (
            <div className="max-w-4xl mx-auto p-4 text-center">
                <p className="text-red-500 font-bold text-xl mb-4">{error}</p>
                <button onClick={() => router.push('/history')} className="text-blue-600 underline hover:text-blue-800">
                    &larr; Return to History
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen md:flex-row gap-4 p-4 overflow-hidden">

            {/* Left Sidebar Details Area */}
            <div className="w-full md:w-1/3 bg-white p-6 rounded shadow-lg overflow-y-auto">
                <button
                    onClick={() => router.push('/history')}
                    className="mb-4 text-sm font-bold text-gray-600 hover:text-black transition"
                >
                    &larr; Back to My Trips
                </button>

                <h1 className="text-3xl font-extrabold text-green-800 mb-2 leading-tight">{trip.title}</h1>

                <div className="flex gap-2 text-sm text-gray-500 font-bold mb-6">
                    <span className="bg-gray-100 px-2 py-1 rounded capitalize">{trip.type}</span>
                    <span className="bg-gray-100 px-2 py-1 rounded">{trip.duration} Days</span>
                    <span className="bg-gray-100 px-2 py-1 rounded">{trip.totalDistanceKm} km Total</span>
                </div>

                {trip.imageUrl && (
                    <img
                        src={trip.imageUrl}
                        alt="Destination Preview"
                        className="w-full h-56 object-cover rounded shadow-md mb-6"
                    />
                )}

                {trip.weatherForecast && (
                    <div className="mb-6 bg-blue-50 border border-blue-100 p-4 rounded-lg">
                        <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                            <span className="text-xl">🌤️</span>
                            {trip.weatherForecast.forecast || "Historical Weather Data"}
                        </h4>
                        <div className="space-y-2">
                            {trip.weatherForecast.details?.map((w, idx) => (
                                <div key={idx} className="flex justify-between text-sm items-center border-b border-blue-100 pb-2 last:border-0 last:pb-0">
                                    <span className="font-medium text-gray-700">{new Date(w.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                    <span className="font-bold text-gray-900 bg-white px-2 py-1 rounded shadow-sm">{w.minTemp}°C - {w.maxTemp}°C</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mt-4">
                    <h4 className="text-xl font-bold border-b pb-2 mb-4 text-gray-800">Itinerary Breakdown</h4>
                    <div className="space-y-4">
                        {trip.itinerary && trip.itinerary.length > 0 ? (
                            trip.itinerary.map((day, idx) => (
                                <div key={idx} className="bg-gray-50 p-4 rounded border border-gray-100 shadow-sm">
                                    <h5 className="font-bold text-gray-800 mb-1">Day {day.day}</h5>
                                    <p className="text-gray-700 text-sm leading-relaxed">{day.description}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded border border-gray-100 italic">
                                Daily details are embedded in the interactive map route. This is a {trip.duration} day {trip.type} trip spanning exactly {trip.totalDistanceKm} kilometers.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Map Area */}
            <div className="w-full md:w-2/3 h-full min-h-[50vh] bg-gray-200 rounded-lg shadow-inner relative overflow-hidden flex-shrink-0">
                <Map routeData={trip.routeData} />
            </div>

        </div>
    );
}
