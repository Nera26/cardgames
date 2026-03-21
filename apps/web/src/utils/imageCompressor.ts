/**
 * Client-Side Image Compressor (Purple Cable)
 *
 * Converts any uploaded image to a 256×256 center-cropped WebP blob.
 * This runs entirely in the browser — the server never sees the raw 10MB PNG.
 */

const TARGET_SIZE = 256;
const WEBP_QUALITY = 0.8;

/**
 * Convert an image File to a center-cropped 256×256 WebP Blob.
 * Uses HTML5 Canvas API for zero-dependency client-side compression.
 */
export function convertToWebP(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            const img = new Image();

            img.onload = () => {
                // Center-crop: take the smaller dimension as the square edge
                const size = Math.min(img.width, img.height);
                const offsetX = (img.width - size) / 2;
                const offsetY = (img.height - size) / 2;

                const canvas = document.createElement('canvas');
                canvas.width = TARGET_SIZE;
                canvas.height = TARGET_SIZE;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Canvas 2D context not available'));
                    return;
                }

                // Draw center-cropped square, scaled to 256×256
                ctx.drawImage(
                    img,
                    offsetX, offsetY, size, size, // Source: center square
                    0, 0, TARGET_SIZE, TARGET_SIZE  // Dest: full canvas
                );

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Canvas toBlob failed'));
                        }
                    },
                    'image/webp',
                    WEBP_QUALITY
                );

                // Cleanup
                URL.revokeObjectURL(img.src);
            };

            img.onerror = () => {
                reject(new Error('Failed to load image'));
                URL.revokeObjectURL(img.src);
            };

            img.src = reader.result as string;
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}
