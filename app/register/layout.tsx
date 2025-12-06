import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function RegisterLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Navbar />
            <main className="flex-grow flex flex-col justify-center">
                {children}
            </main>
            <Footer />
        </div>
    );
}
