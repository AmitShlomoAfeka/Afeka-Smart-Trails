'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import api from '../../lib/api';
import { useRouter } from 'next/navigation';

// Dynamically import Map with no SSR
const Map = dynamic(() => import('../../components/Map'), {
    ssr: false,
    loading: () => <div className="h-96 w-full flex items-center justify-center bg-gray-100">Loading Map...</div>
});

export default function PlanTrip() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        country: '',
        city: '',
        type: 'trek',
        duration: 1,
        provider: 'openai',
        apiKey: ''
    });
    const [tripResult, setTripResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // Basic auth check
        if (!localStorage.getItem('token')) {
            router.push('/login');
        }
    }, [router]);

    const handleGenerate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setTripResult(null);
        try {
            const res = await api.post('/trips/generate', formData);
            setTripResult(res.data);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to generate trip. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!tripResult) return;
        try {
            await api.post('/trips/save', {
                country: formData.country,
                city: formData.city,
                type: formData.type,
                duration: formData.duration,
                routeData: tripResult.route,
                title: tripResult.title,
                imageUrl: tripResult.imageUrl,
                totalDistanceKm: tripResult.totalDistanceKm,
                weatherForecast: tripResult.weather,
                itinerary: tripResult.itinerary
            });
            alert('Trip saved successfully!');
            router.push('/history');
        } catch (err) {
            console.error("Save error:", err);
            alert('Failed to save trip');
        }
    };

    return (
        <div className="flex flex-col md:flex-row h-screen gap-4 p-4">
            {/* Sidebar / Form */}
            <div className="w-full md:w-1/3 bg-white p-6 rounded shadow-lg overflow-y-auto">
                <h2 className="text-2xl font-bold mb-4">Plan Your Adventure</h2>
                <form onSubmit={handleGenerate} className="space-y-4">
                    <div>
                        <label className="block text-gray-900 font-bold mb-1">Country</label>
                        <input
                            type="text"
                            className="w-full p-2 border rounded"
                            value={formData.country}
                            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-900 font-bold mb-1">City (Optional)</label>
                        <input
                            type="text"
                            className="w-full p-2 border rounded"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-gray-900 font-bold mb-1">Type</label>
                        <select
                            className="w-full p-2 border rounded"
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        >
                            <option value="trek">Trekking (Foot)</option>
                            <option value="bike">Biking</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-gray-900 font-bold mb-1">Duration (Days)</label>
                        <input
                            type="number"
                            min="1"
                            max="14"
                            className="w-full p-2 border rounded"
                            value={formData.duration}
                            onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                        />
                    </div>

                    <div className="border-t pt-4 mt-2">
                        <label className="block text-gray-900 font-bold mb-1">AI Provider</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name="provider"
                                    value="openai"
                                    checked={formData.provider === 'openai'}
                                    onChange={(e) => setFormData({ ...formData, provider: e.target.value, apiKey: '' })}
                                />
                                OpenAI
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name="provider"
                                    value="gemini"
                                    checked={formData.provider === 'gemini'}
                                    onChange={(e) => setFormData({ ...formData, provider: e.target.value, apiKey: '' })}
                                />
                                Google Gemini
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-gray-900 font-bold mb-1">
                            {formData.provider === 'openai' ? 'OpenAI API Key' : 'Gemini API Key'} (Optional)
                        </label>
                        <input
                            type="password"
                            placeholder={formData.provider === 'openai' ? "sk-proj-..." : "AIzaSy..."}
                            className="w-full p-2 border rounded"
                            value={formData.apiKey}
                            onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                        />
                        <span className="text-xs text-gray-500">Leave blank to use server environment variable.</span>
                    </div>

                    <button
                        type="submit"
                        className={`w-full py-3 rounded text-white font-bold transition ${loading ? 'bg-gray-500' : 'bg-green-600 hover:bg-green-700'}`}
                        disabled={loading}
                    >
                        {loading ? 'Generating Route...' : 'Generate Trip'}
                    </button>
                </form>

                {error && <p className="text-red-500 mt-4">{error}</p>}

                {tripResult && (
                    <div className="mt-6 border-t pt-4">
                        <h3 className="text-2xl font-bold text-green-700">{tripResult.title}</h3>
                        <p className="text-gray-900 font-medium mb-4">Total Map Distance: {tripResult.totalDistanceKm || '?'} km</p>

                        {tripResult.imageUrl && (
                            <img src={tripResult.imageUrl} alt="Destination Preview" className="w-full h-48 object-cover rounded shadow mb-4" />
                        )}

                        <div className="mt-2 bg-blue-50 p-3 rounded">
                            <h4 className="font-bold text-blue-900">{tripResult.weather?.forecast}</h4>
                            <div className="space-y-1 mt-2">
                                {tripResult.weather?.details?.map((w, idx) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                        <span>{new Date(w.date).toLocaleDateString()}</span>
                                        <span>{w.minTemp}°C - {w.maxTemp}°C</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-4">
                            <h4 className="font-bold">Generated Itinerary</h4>
                            <ul className="list-disc pl-5 text-sm space-y-2 mt-2">
                                {tripResult.itinerary?.map((day, i) => (
                                    <li key={i}><strong>Day {day.day}:</strong> {day.description}</li>
                                ))}
                            </ul>
                        </div>

                        <button
                            onClick={handleSave}
                            className="w-full mt-6 bg-blue-600 text-white py-3 rounded hover:bg-blue-700 font-bold"
                        >
                            Approve & Save Trip
                        </button>
                    </div>
                )}
            </div>

            {/* Map Area */}
            <div className="w-full md:w-2/3 bg-gray-200 rounded shadow-inner relative">
                <div className="absolute inset-0 z-0">
                    <Map routeData={tripResult?.route} />
                </div>
            </div>
        </div>
    );
}
