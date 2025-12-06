'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    Building2,
    FileCheck,
    Settings,
    LogOut,
    Menu,
    X
} from 'lucide-react';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const navigation = [
        { name: 'Tableau de bord', href: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Validations', href: '/admin/validations', icon: UserCheckIcon },
        { name: 'Entreprises', href: '/admin/companies', icon: Building2 },
        { name: 'Utilisateurs', href: '/admin/users', icon: Users },
        { name: 'Audit Documents', href: '/admin/audit', icon: FileCheck },
        { name: 'Paramètres', href: '/admin/settings', icon: Settings },
    ];

    // Helper component for icon to avoid "UserCheck is not defined" if using lucide-react directly
    function UserCheckIcon(props: any) {
        return (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                {...props}
            >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <polyline points="16 11 18 13 22 9"></polyline>
            </svg>
        )
    }

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.href = '/login';
        } catch (error) {
            console.error('Erreur déconnexion:', error);
            //window.location.href = '/login';
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}

            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex items-center justify-between h-16 px-4 bg-gray-800">
                    <span className="text-xl font-bold tracking-wider">SADIC ADMIN</span>
                    <button
                        className="md:hidden text-gray-400 hover:text-white"
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <nav className="mt-5 px-2 space-y-1">
                    {navigation.map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`group flex items-center px-2 py-2 text-base font-medium rounded-md transition-colors ${isActive
                                    ? 'bg-gray-800 text-white'
                                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                    }`}
                            >
                                <item.icon className={`mr-4 h-6 w-6 ${isActive ? 'text-blue-400' : 'text-gray-400 group-hover:text-gray-300'}`} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="absolute bottom-0 w-full p-4 bg-gray-800">
                    <button onClick={handleLogout} className="flex items-center w-full px-2 py-2 text-sm font-medium text-red-400 rounded-md hover:bg-gray-700 hover:text-red-300">
                        <LogOut className="mr-3 h-5 w-5" />
                        Déconnexion
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="md:pl-64 flex flex-col min-h-screen">
                {/* Top Header (Mobile only) */}
                <div className="sticky top-0 z-10 flex items-center justify-between h-16 bg-white shadow-sm md:hidden px-4">
                    <button
                        className="text-gray-500 hover:text-gray-700"
                        onClick={() => setIsSidebarOpen(true)}
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <span className="text-lg font-semibold text-gray-900">Administration</span>
                    <div className="w-6"></div> {/* Spacer */}
                </div>

                <main className="flex-1 p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
