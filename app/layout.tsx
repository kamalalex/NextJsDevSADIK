import './globals.css';

export const metadata = {
  title: 'Transport SaaS',
  description: 'Plateforme de gestion de transport',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" 
        />
      </head>
      <body className="bg-gray-50 dark:bg-gray-900">
        {children}
      </body>
    </html>
  )
}