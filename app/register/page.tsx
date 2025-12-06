import Link from 'next/link';
import { Truck, Building2, UserCheck, ArrowLeft } from 'lucide-react';

export default function RegisterSelection() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <Link href="/" className="flex items-center justify-center text-gray-500 hover:text-gray-900 mb-8">
                    <ArrowLeft className="w-5 h-5 mr-2" /> Retour à l'accueil
                </Link>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Créer un compte
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Choisissez votre type de compte pour commencer
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-4xl">
                <div className="grid md:grid-cols-3 gap-6 px-4">
                    <Link
                        href="/register/shipper"
                        className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-200 hover:border-blue-500 group text-center"
                    >
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-600 transition-colors">
                            <Building2 className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">Expéditeur</h3>
                        <p className="mt-2 text-sm text-gray-500">
                            Entreprise souhaitant expédier des marchandises.
                        </p>
                    </Link>

                    <Link
                        href="/register/transport"
                        className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-200 hover:border-indigo-500 group text-center"
                    >
                        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-indigo-600 transition-colors">
                            <Truck className="w-6 h-6 text-indigo-600 group-hover:text-white transition-colors" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">Transporteur</h3>
                        <p className="mt-2 text-sm text-gray-500">
                            Société de transport avec une flotte de véhicules.
                        </p>
                    </Link>

                    <Link
                        href="/register/driver"
                        className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-200 hover:border-emerald-500 group text-center"
                    >
                        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-emerald-600 transition-colors">
                            <UserCheck className="w-6 h-6 text-emerald-600 group-hover:text-white transition-colors" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">Chauffeur Indépendant</h3>
                        <p className="mt-2 text-sm text-gray-500">
                            Chauffeur professionnel travaillant à son compte.
                        </p>
                    </Link>
                </div>
            </div>
        </div>
    );
}
