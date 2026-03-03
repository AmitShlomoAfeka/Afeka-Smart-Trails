'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Navbar() {
    const router = useRouter();
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        setIsLoggedIn(!!token);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        setIsLoggedIn(false);
        router.push('/login');
    };

    return (
        <nav className="bg-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex justify-between items-center py-4">
                    <div className="flex items-center">
                        <Link href="/" className="text-2xl font-bold text-green-600">
                            Afeka Trails 2026
                        </Link>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Link href="/" className="text-gray-900 hover:text-green-600">Home</Link>
                        {isLoggedIn ? (
                            <>
                                <Link href="/plan" className="text-gray-900 hover:text-green-600">Plan Trip</Link>
                                <Link href="/history" className="text-gray-900 hover:text-green-600">My Trips</Link>
                                <button onClick={handleLogout} className="text-red-600 hover:text-red-800">Logout</button>
                            </>
                        ) : (
                            <>
                                <Link href="/login" className="text-gray-900 hover:text-green-600">Login</Link>
                                <Link href="/register" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Register</Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
