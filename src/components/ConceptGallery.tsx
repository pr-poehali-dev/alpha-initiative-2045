interface Props { images: string[] }

const LABELS = ['Прогулка', 'Игра', 'Кормление', 'Купание'];

export default function ConceptGallery({ images }: Props) {
  return (
    <div className="mt-8 w-full">
      <h2 className="font-pixel text-sm text-[#ffd23f] mb-4 text-center">КОНЦЕПТ-АРТЫ</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {images.map((src, i) => (
          <div key={i} className="rounded-2xl overflow-hidden border border-white/10 group relative">
            <img src={src} alt={LABELS[i]} className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-300" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-2 left-0 right-0 text-center font-lcd text-xl text-white">{LABELS[i]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
