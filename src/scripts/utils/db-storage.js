const DB_NAME = "app-story-cache";
const DB_VERSION = 2; // ✅ Naikkan versi agar upgrade dijalankan

const STORES = {
  STORIES: "stories",
  STORY_DETAILS: "story-details",
  SAVED_PHOTOS: "saved-photos", // ✅ Tambahkan ini
};

// Initialize the database
const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains(STORES.STORIES)) {
        db.createObjectStore(STORES.STORIES, { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains(STORES.STORY_DETAILS)) {
        db.createObjectStore(STORES.STORY_DETAILS, { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains(STORES.SAVED_PHOTOS)) {
        db.createObjectStore(STORES.SAVED_PHOTOS, { keyPath: "id" }); // ✅ Buat object store baru
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) =>
      reject(`Database error: ${event.target.errorCode}`);
  });
};

// Save stories to cache
export const saveStories = async (storiesData) => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.STORIES, "readwrite");
      const store = transaction.objectStore(STORES.STORIES);

      const storeRequest = store.put({
        id: "latest",
        timestamp: Date.now(),
        data: storiesData,
      });

      storeRequest.onsuccess = () => resolve(true);
      storeRequest.onerror = () => reject(new Error("Failed to save stories"));

      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    console.error("Error saving stories to IndexedDB:", error);
    return false;
  }
};

export const getStoriesFromCache = async () => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.STORIES, "readonly");
      const store = transaction.objectStore(STORES.STORIES);
      const request = store.get("latest");

      request.onsuccess = (event) => {
        const result = event.target.result;
        resolve(result ? result.data : null);
      };

      request.onerror = () =>
        reject(new Error("Failed to get stories from cache"));

      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    console.error("Error getting stories from IndexedDB:", error);
    return null;
  }
};

// Save individual story detail
export const saveStoryDetail = async (id, storyDetail) => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.STORY_DETAILS, "readwrite");
      const store = transaction.objectStore(STORES.STORY_DETAILS);

      const storeRequest = store.put({
        id,
        timestamp: Date.now(),
        data: storyDetail,
      });

      storeRequest.onsuccess = () => resolve(true);
      storeRequest.onerror = () =>
        reject(new Error(`Failed to save story detail for ID: ${id}`));

      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    console.error(`Error saving story detail for ID ${id}:`, error);
    return false;
  }
};

// Get individual story detail
export const getStoryDetailFromCache = async (id) => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.STORY_DETAILS, "readonly");
      const store = transaction.objectStore(STORES.STORY_DETAILS);
      const request = store.get(id);

      request.onsuccess = (event) => {
        const result = event.target.result;
        resolve(result ? result.data : null);
      };

      request.onerror = () =>
        reject(new Error(`Failed to get story detail for ID: ${id}`));

      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    console.error(`Error getting story detail for ID ${id}:`, error);
    return null;
  }
};

// ✅ Save photo to saved-photos
export const savePhotoToSavedPhotos = async (photoData) => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.SAVED_PHOTOS, "readwrite");
      const store = transaction.objectStore(STORES.SAVED_PHOTOS);

      const storeRequest = store.put({
        id: photoData.id,
        timestamp: Date.now(),
        data: photoData,
      });

      storeRequest.onsuccess = () => resolve(true);
      storeRequest.onerror = () =>
        reject(new Error("Failed to save photo to saved photos"));

      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    console.error("Error saving photo to saved photos:", error);
    return false;
  }
};

// ✅ Get all saved photos
export const getAllSavedPhotos = async () => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.SAVED_PHOTOS, "readonly");
      const store = transaction.objectStore(STORES.SAVED_PHOTOS);
      const request = store.getAll();

      request.onsuccess = (event) => {
        const result = event.target.result;
        const photos = result.map((item) => item.data);
        resolve(photos);
      };

      request.onerror = () => reject(new Error("Failed to get saved photos"));

      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    console.error("Error getting saved photos from IndexedDB:", error);
    return [];
  }
};

// ✅ Remove photo from saved-photos
export const removePhotoFromSave = async (id) => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.SAVED_PHOTOS, "readwrite");
      const store = transaction.objectStore(STORES.SAVED_PHOTOS);
      const request = store.delete(id);

      request.onsuccess = () => resolve(true);
      request.onerror = () =>
        reject(new Error(`Failed to remove photo with ID: ${id}`));

      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    console.error(`Error removing photo with ID ${id}:`, error);
    return false;
  }
};

export async function isStorySaved(id) {
  const all = await getAllSavedPhotos();
  return all.some((item) => item.id === id);
}

// Check online status
export const isOnline = () => {
  return navigator.onLine;
};
