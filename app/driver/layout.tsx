'use client';

import React, { useState, useEffect } from 'react';
import { Truck, LayoutDashboard, ClipboardList, CheckSquare, User, LogOut, Menu, X, FileText } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

export default function DriverLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [user, setUser] = useState<any>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        fetchUser();
    }, []);

    // Close menu when route changes
    useEffect(() => {
        setIsMenuOpen(false);
    }, [pathname]);

    const fetchUser = async () => {
        try {
            const response = await fetch('/api/user/me');
            if (response.ok) {
                const data = await response.json();
                setUser(data);
            }
        } catch (error) {
            console.error('Error fetching user:', error);
        }
    };

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.href = '/login';
        } catch (error) {
            console.error('Erreur déconnexion:', error);
            window.location.href = '/login';
        }
    };

    const navItems = [
        { href: '/driver/dashboard', label: 'Tableau de bord', icon: <LayoutDashboard size={20} /> },
        { href: '/driver/missions?status=CURRENT', label: 'Missions en cours', icon: <ClipboardList size={20} /> },
        { href: '/driver/missions?status=COMPLETED', label: 'Missions terminées', icon: <CheckSquare size={20} /> },
        { href: '/driver/expenses', label: 'Mes Frais', icon: <FileText size={20} /> },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="bg-white shadow-sm border-b sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                            <div className="bg-blue-600 p-2 rounded-lg">
                                <Truck className="h-6 w-6 text-white" />
                            </div>
                            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Espace Chauffeur</h1>
                        </div>

                        <div className="flex items-center gap-4">
                            {user && (
                                <div className="hidden sm:flex items-center gap-3">
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-gray-900">{user.name}</p>
                                        <p className="text-xs text-gray-500">{user.email}</p>
                                    </div>
                                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center border border-blue-200 text-blue-700 font-bold">
                                        {user.avatar ? (
                                            <img src={user.avatar} alt={user.name} className="h-full w-full object-cover rounded-full" />
                                        ) : (
                                            <span>{user.name?.charAt(0)}</span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Mobile Menu Button */}
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>

                            <button
                                onClick={handleLogout}
                                className="hidden md:block p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Déconnexion"
                            >
                                <LogOut size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                {isMenuOpen && (
                    <div className="md:hidden bg-white border-b border-gray-100 shadow-lg absolute w-full z-30">
                        <div className="px-4 py-2 space-y-1">
                            {user && (
                                <div className="flex items-center gap-3 py-3 border-b border-gray-100 mb-2">
                                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center border border-blue-200 text-blue-700 font-bold">
                                        {user.avatar ? (
                                            <img src={user.avatar} alt={user.name} className="h-full w-full object-cover rounded-full" />
                                        ) : (
                                            <span>{user.name?.charAt(0)}</span>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{user.name}</p>
                                        <p className="text-xs text-gray-500">{user.email}</p>
                                    </div>
                                </div>
                            )}

                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${pathname === item.href.split('?')[0]
                                        ? 'bg-blue-50 text-blue-600'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                >
                                    {item.icon}
                                    {item.label}
                                </Link>
                            ))}
                            <Link
                                href="/driver/profile"
                                className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${pathname === '/driver/profile'
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <User size={20} />
                                Mon Profil
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                            >
                                <LogOut size={20} />
                                Déconnexion
                            </button>
                        </div>
                    </div>
                )}
            </header>

            {/* Desktop Navigation */}
            <div className="bg-white border-b hidden md:block">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Suspense fallback={<div className="h-14" />}>
                        <DesktopNav pathname={pathname} navItems={navItems} />
                    </Suspense>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 pb-20 md:pb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    {children}
                </div>
            </main>
        </div>
    );
}

function DesktopNav({ pathname, navItems }: { pathname: string, navItems: any[] }) {
    const searchParams = useSearchParams();

    return (
        <nav className="flex space-x-8">
            {navItems.map((item) => {
                const [itemPath, itemQuery] = item.href.split('?');
                const isPathMatch = pathname === itemPath;

                // Check query params if they exist in the item href
                let isQueryMatch = true;
                if (itemQuery) {
                    const currentStatus = searchParams.get('status');
                    const itemStatus = new URLSearchParams(itemQuery).get('status');
                    isQueryMatch = currentStatus === itemStatus;

                    // Default to CURRENT if no status param is present and we're on the missions page
                    if (!currentStatus && itemPath === '/driver/missions' && itemStatus === 'CURRENT') {
                        isQueryMatch = true;
                    } else if (!currentStatus && itemPath === '/driver/missions' && itemStatus !== 'CURRENT') {
                        isQueryMatch = false;
                    }
                }

                const isActive = isPathMatch && isQueryMatch;

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${isActive
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        {item.icon}
                        {item.label}
                    </Link>
                )
            })}
            <Link
                href="/driver/profile"
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${pathname === '/driver/profile'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
            >
                <User size={20} />
                Mon Profil
            </Link>
        </nav>
    );
}
