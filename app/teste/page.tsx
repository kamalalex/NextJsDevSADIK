export default function TestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-blue-500 text-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold">Tailwind v4 Test</h1>
        <p className="mt-2">Si ce texte est bleu, Tailwind fonctionne !</p>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="bg-red-500 p-4 rounded">Red</div>
          <div className="bg-green-500 p-4 rounded">Green</div>
        </div>
      </div>
    </div>
  )
}