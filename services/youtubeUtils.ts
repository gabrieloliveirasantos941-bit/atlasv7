export const extractYouTubeVideoId = (url: string) => {
    if (!url) return null;
    
    // Handle standard URLs (youtube.com/watch?v=...)
    const standardUrlMatch = url.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/);
    if (standardUrlMatch) return standardUrlMatch[1];

    // Handle short URLs (youtu.be)
    const shortUrlMatch = url.match(/(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (shortUrlMatch) return shortUrlMatch[1];
    
    // Handle embed URLs (youtube.com/embed/...)
    const embedUrlMatch = url.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
    if (embedUrlMatch) return embedUrlMatch[1];

    // Handle shorts URLs (youtube.com/shorts/...)
    const shortsUrlMatch = url.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
    if (shortsUrlMatch) return shortsUrlMatch[1];
    
    // Handle mobile URLs (m.youtube.com/watch?v=...)
    const mobileUrlMatch = url.match(/(?:https?:\/\/)?m\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/);
    if (mobileUrlMatch) return mobileUrlMatch[1];

    return null;
};

export const checkYouTubeVideoAvailability = async (videoId: string): Promise<boolean> => {
    try {
        // Use a more reliable way to check availability if possible, 
        // but for now, we'll use the image trick as a heuristic.
        // If the 'mqdefault.jpg' is the "video unavailable" image, it's usually 120x90 or has a specific size.
        // However, a better way is to use the YouTube oEmbed API via a proxy if available.
        // Since we are in a browser, we'll attempt a simple fetch to oembed which might fail due to CORS,
        // but we can also check the image size.
        
        const img = new Image();
        return new Promise((resolve) => {
            img.onload = () => {
                // The "unavailable" image is usually 120x90.
                if (img.width === 120 && img.height === 90) {
                    resolve(false);
                } else {
                    resolve(true);
                }
            };
            img.onerror = () => resolve(false);
            img.src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
        });
    } catch (error) {
        return true; // Fallback to true to avoid blocking potentially valid videos
    }
};
