export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          403 - Accès Refusé
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Vous n'avez pas les permissions nécessaires pour accéder à cette page.
        </p>
        <a
          href="/dashboard"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-300"
        >
          Retour au tableau de bord
        </a>
      </div>
    </div>
  );
}