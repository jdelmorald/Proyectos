import { deletePhoto } from "@/lib/actions/suppliers";
import { PHOTO_CATEGORY_LABELS } from "@/lib/suppliers";

type Photo = {
  id: string;
  category: string;
  originalName: string;
};

export function PhotoGallery({ photos }: { photos: Photo[] }) {
  if (photos.length === 0) {
    return (
      <p className="text-sm text-ink-soft">
        Todavía no hay fotos. Agrega una del local y otras de los productos
        más abajo.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {photos.map((photo) => (
        <div key={photo.id} className="relative group rounded-xl overflow-hidden border border-line bg-paper">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/photos/${photo.id}`}
            alt={photo.originalName}
            className="w-full aspect-square object-cover"
          />
          <span className="absolute bottom-0 inset-x-0 bg-ink/70 text-white text-[10px] px-2 py-1 truncate">
            {PHOTO_CATEGORY_LABELS[photo.category] ?? photo.category}
          </span>
          <form action={deletePhoto} className="absolute top-1.5 right-1.5">
            <input type="hidden" name="photoId" value={photo.id} />
            <button
              type="submit"
              title="Eliminar foto"
              className="w-6 h-6 rounded-full bg-ink/70 text-white text-xs leading-none hover:bg-red-700 transition-colors flex items-center justify-center"
            >
              ×
            </button>
          </form>
        </div>
      ))}
    </div>
  );
}
