import React from 'react';
import { Truck, Home, User, List } from 'lucide-react';
import Link from 'next/link';

export default function DriverLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Mobile-first Header */}
            <header className="bg-blue-700 text-white p-4 shadow-md sticky top-0 z-10 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                    <Truck className="h-6 w-6" />
                    <h1 className="text-lg font-bold">Space Driver</h1>
                </div>
                <div className="text-sm opacity-80">
                    {/* Status indicator could go here */}
                    Online
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 pb-20 overflow-y-auto">
                {children}
            </main>

            {/* Bottom Navigation for Mobile */}
            <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 shadow-lg z-20 pb-safe">
                <div className="flex justify-around items-center h-16">
                    <Link href="/driver/dashboard" className="flex flex-col items-center justify-center w-full h-full text-gray-600 hover:text-blue-600 active:text-blue-700">
                        <Home className="h-6 w-6" />
                        <span className="text-xs mt-1">Accueil</span>
                    </Link>
                    <Link href="/driver/missions" className="flex flex-col items-center justify-center w-full h-full text-gray-600 hover:text-blue-600 active:text-blue-700">
                        <List className="h-6 w-6" />
                        <span className="text-xs mt-1">Missions</span>
                    </Link>
                    <Link href="/driver/profile" className="flex flex-col items-center justify-center w-full h-full text-gray-600 hover:text-blue-600 active:text-blue-700">
                        <User className="h-6 w-6" />
                        <span className="text-xs mt-1">Profil</span>
                    </Link>
                </div>
            </nav>
        </div>
    );
}
