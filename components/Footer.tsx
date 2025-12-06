export default function Footer() {
    return (
        <footer className="bg-white border-t py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500">
                <p>&copy; {new Date().getFullYear()} SADIC. Tous droits réservés.</p>
            </div>
        </footer>
    );
}
