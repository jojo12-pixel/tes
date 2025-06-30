const DB_NAME = 'ImageStorageDB';
const DB_VERSION = 1;
const STORE_NAME = 'images';

let db;

/**
 * Opens or creates the IndexedDB database.
 * @returns {Promise<IDBDatabase>} A promise that resolves with the database instance.
 */
async function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                // Create an object store to hold images, with auto-incrementing ID
                db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            console.log('IndexedDB opened successfully');
            resolve(db);
        };

        request.onerror = (event) => {
            console.error('IndexedDB error:', event.target.error);
            reject(event.target.error);
        };
    });
}

/**
 * Saves an image (Data URL) to IndexedDB.
 * @param {string} dataUrl - The Data URL of the image.
 * @param {string} fileName - The name of the file.
 * @returns {Promise<void>} A promise that resolves when the image is saved.
 */
async function saveImage(dataUrl, fileName) {
    if (!db) {
        await openDatabase(); // Ensure db is open before transaction
    }
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const imageObject = {
            dataUrl: dataUrl,
            fileName: fileName,
            timestamp: Date.now() // Optional: add a timestamp
        };
        const request = store.add(imageObject);

        request.onsuccess = () => {
            console.log('Image saved to IndexedDB:', fileName);
            resolve();
        };

        request.onerror = (event) => {
            console.error('Error saving image:', event.target.error);
            reject(event.target.error);
        };
    });
}

/**
 * Loads all images from IndexedDB and displays them in the gallery.
 */
async function loadImages() {
    const galleryDiv = document.getElementById('imageGallery');
    galleryDiv.innerHTML = ''; // Clear existing images before loading

    if (!db) {
        await openDatabase(); // Ensure db is open before loading
    }

    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll(); // Get all objects from the store

    request.onsuccess = (event) => {
        const images = event.target.result;
        // Sort images by timestamp (newest first)
        images.sort((a, b) => b.timestamp - a.timestamp);
        
        images.forEach(image => {
            const imgElement = document.createElement('img');
            imgElement.src = image.dataUrl;
            imgElement.alt = `Gambar: ${image.fileName}`; // Accessible alt text
            imgElement.title = image.fileName; // Tooltip on hover
            galleryDiv.appendChild(imgElement);
        });
        console.log(`Loaded ${images.length} images from IndexedDB.`);
    };

    request.onerror = (event) => {
        console.error('Error loading images:', event.target.error);
    };
}

// Event listener for file input when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', async () => {
    const imageInput = document.getElementById('imageInput');

    // Initialize database and load any previously saved images
    await openDatabase();
    await loadImages();

    // Add event listener for file selection
    imageInput.addEventListener('change', async (event) => {
        const files = event.target.files;
        if (files.length === 0) {
            return; // No files selected
        }

        for (const file of files) {
            // Check if the selected file is an image
            if (!file.type.startsWith('image/')) {
                console.warn(`File "${file.name}" skipped: Not an image.`);
                continue;
            }

            const reader = new FileReader();
            reader.onloadend = async () => {
                const dataUrl = reader.result;
                // Save the image Data URL to IndexedDB
                await saveImage(dataUrl, file.name);

                // Dynamically add the new image to the gallery without reloading everything
                const galleryDiv = document.getElementById('imageGallery');
                const imgElement = document.createElement('img');
                imgElement.src = dataUrl;
                imgElement.alt = `Gambar: ${file.name}`;
                imgElement.title = file.name;
                // Prepend the new image so it appears at the top/start of the gallery
                galleryDiv.prepend(imgElement); 
            };
            // Read the file as a Data URL (base64 encoded string)
            reader.readAsDataURL(file);
        }
        // Clear the input value so the same file can be selected again after deletion/refresh (not implemented here)
        event.target.value = ''; 
    });
});

