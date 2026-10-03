// Build-time image measurement for devlog media.
//
// Devlog images come in very different shapes (0.35 to 2.0 wide-to-tall), so
// each one is shown in one of two fixed frames - 16:9 or 1:1 - picked from its
// real size here. The frame's space is reserved before anything loads (no
// layout shift) and the image is fitted inside it uncropped. A video's poster
// is its `image`, so the same measurement covers both.

import { join } from 'node:path';
import sharp from 'sharp';

export type MediaFrame = 'wide' | 'square';

export interface MediaSize {
    width: number;
    height: number;
    frame: MediaFrame;
}

/** Images at least this much wider than tall get the 16:9 frame. */
const WIDE_RATIO = 1.3;

const cache = new Map<string, Promise<MediaSize>>();

/** Measure an image under public/, e.g. "/assets/devlog/devlog-09.png". */
export function getMediaSize(publicPath: string): Promise<MediaSize> {
    let size = cache.get(publicPath);
    if (!size) {
        size = sharp(join(process.cwd(), 'public', publicPath))
            .metadata()
            .then(({ width, height, pageHeight }) => {
                // Animated images report the whole frame strip as `height`.
                const h = pageHeight ?? height;
                if (!width || !h) throw new Error(`could not measure ${publicPath}`);
                return { width, height: h, frame: width / h >= WIDE_RATIO ? 'wide' : 'square' };
            });
        cache.set(publicPath, size);
    }
    return size;
}
