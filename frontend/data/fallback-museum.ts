import type { MuseumData } from "@/lib/types";
import galleryPhotosRaw from "./gallery-photos.json";

// This is the museum's built-in data, generated from the real photos in
// public/photos/gallery/ (see scripts/import-photos.mjs). Every caption
// below is a placeholder — replace the "✏️" lines with your own words.
//
// The most recent photo is reserved for the birthday finale room so it
// isn't shown twice; everything else hangs in the main gallery hall.

const allPhotos = [...galleryPhotosRaw];
const finalePhoto = allPhotos.pop();
const galleryPhotos = allPhotos;

export const fallbackMuseum: MuseumData = {
  meta: {
    title: "A Little Museum of Us",
    recipientName: "You",
    subtitle: "Happy Birthday — walk around and see for yourself",
    welcomeMessage:
      "Every wall here holds a memory. Take your time, wander through, and look closely — there's a little museum of us, made just for you.",
    finalMessage:
      "Happy birthday, my love.\n\nEvery photo in this museum is a moment I never want to forget — and there are so many more still to make with you. Thank you for filling my life with the kind of days worth building a museum for.\n\nHere's to another year of us. I love you more than any of these walls could hold.",
  },
  rooms: [
    {
      id: "gallery",
      name: "Us",
      description: "",
      width: 13,
      depth: 10,
      height: 5.6,
      photos: galleryPhotos,
    },
    {
      id: "birthday",
      name: "For You, Today",
      description: "",
      width: 13,
      depth: 11,
      height: 5,
      isFinal: true,
      photos: finalePhoto
        ? [
            {
              ...finalePhoto,
              caption: "✏️ Replace this caption with your own words for her, today.",
              width: 1.9,
              height: finalePhoto.width && finalePhoto.height ? (1.9 * finalePhoto.height) / finalePhoto.width : 1.4,
            },
          ]
        : [],
    },
  ],
};
