import Link from 'next/link';
import { Truck, Building2, UserCheck, ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <main className="pt-16 pb-24 flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight mb-6">
              La plateforme de référence pour le <span className="text-blue-600">transport logistique</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Connectez-vous à un réseau fiable de transporteurs, expéditeurs et chauffeurs indépendants.
              Gérez vos opérations en toute simplicité.
            </p>
            <div className="flex justify-center gap-4">
              <Link
                href="/register"
                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 flex items-center"
              >
                Commencer maintenant <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Account Types */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            {/* Shipper */}
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all border border-gray-100 group">
              <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors">
                <Building2 className="w-7 h-7 text-blue-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Expéditeur</h3>
              <p className="text-gray-600 mb-6">
                Trouvez des transporteurs fiables pour vos marchandises et suivez vos expéditions.
              </p>
              <Link
                href="/register/shipper"
                className="text-blue-600 font-semibold flex items-center group-hover:translate-x-1 transition-transform"
              >
                Créer un compte expéditeur <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </div>

            {/* Transport Company */}
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all border border-gray-100 group">
              <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 transition-colors">
                <Truck className="w-7 h-7 text-indigo-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Société de Transport</h3>
              <p className="text-gray-600 mb-6">
                Gérez votre flotte, vos chauffeurs et trouvez de nouvelles opportunités de transport.
              </p>
              <Link
                href="/register/transport"
                className="text-indigo-600 font-semibold flex items-center group-hover:translate-x-1 transition-transform"
              >
                Créer un compte transporteur <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </div>

            {/* Independent Driver */}
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all border border-gray-100 group">
              <div className="w-14 h-14 bg-emerald-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-emerald-600 transition-colors">
                <UserCheck className="w-7 h-7 text-emerald-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Chauffeur Indépendant</h3>
              <p className="text-gray-600 mb-6">
                Trouvez des missions, gérez votre disponibilité et recevez vos paiements directement.
              </p>
              <Link
                href="/register/driver"
                className="text-emerald-600 font-semibold flex items-center group-hover:translate-x-1 transition-transform"
              >
                Créer un compte chauffeur <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}