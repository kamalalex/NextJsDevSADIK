import Link from 'next/link';

export default function Navbar() {
    return (
        <nav className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center">
                        <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            SADIC
                        </Link>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Link
                            href="/login"
                            className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                        >
                            Se connecter
                        </Link>
                        <Link
                            href="/register"
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                        >
                            S'inscrire
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}
