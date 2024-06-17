import { openDB } from 'idb';

const DB_NAME = 'mediaStorage';
const DB_VERSION = 1;
const IMG_STORE = 'images';
const VID_STORE = 'videos';

const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(IMG_STORE)) {
        db.createObjectStore(IMG_STORE, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(VID_STORE)) {
        db.createObjectStore(VID_STORE, { keyPath: 'id', autoIncrement: true });
      }
    },
  });
};

export const getAllImages = async () => {
  const db = await initDB();
  return db.getAll(IMG_STORE);
};

export const addImage = async (image) => {
  const db = await initDB();
  await db.add(IMG_STORE, { image });
};

export const deleteImageById = async (id) => {
  const db = await initDB();
  await db.delete(IMG_STORE, id);
};

export const getAllVideos = async () => {
  const db = await initDB();
  return db.getAll(VID_STORE);
};

export const addVideo = async (videoData) => {
  const db = await initDB();
  await db.add(VID_STORE, { url: videoData.url, blob: videoData.blob });
};

export const deleteVideoById = async (id) => {
  const db = await initDB();
  await db.delete(VID_STORE, id);
};
