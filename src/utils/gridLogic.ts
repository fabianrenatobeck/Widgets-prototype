// src/utils/gridLogic.ts
import { WidgetInstance, WidgetSize } from '@/types';

export const COLS = 2;
export const ROWS = 6;
export const TOTAL_SLOTS = COLS * ROWS;

// Konvertiert Größe String in Zahlen
export const getSizeDims = (size: WidgetSize): { w: number; h: number } => {
    const [w, h] = size.split('x').map(Number);
    return { w, h };
};

// Berechnet alle belegten Indizes eines Widgets basierend auf Position und Größe
export const getOccupiedIndices = (position: number, size: WidgetSize): number[] => {
    const { w, h } = getSizeDims(size);
    const startRow = Math.floor(position / COLS);
    const startCol = position % COLS;
    const indices: number[] = [];

    for (let r = 0; r < h; r++) {
        for (let c = 0; c < w; c++) {
            const currentRow = startRow + r;
            const currentCol = startCol + c;

            // Abbruch, wenn wir das Grid verlassen
            if (currentCol >= COLS || currentRow >= ROWS) continue;

            indices.push(currentRow * COLS + currentCol);
        }
    }
    return indices;
};

// Prüft, ob eine Aktion (Move/Resize) Kollisionen verursacht
export const hasCollision = (
    targetPos: number,
    targetSize: WidgetSize,
    allWidgets: WidgetInstance[],
    ignoreWidgetId?: string // Das Widget, das wir gerade bewegen, ignorieren
): boolean => {
    const targetIndices = getOccupiedIndices(targetPos, targetSize);
    const { w, h } = getSizeDims(targetSize);

    // 1. Grid Grenzen prüfen
    const startRow = Math.floor(targetPos / COLS);
    const startCol = targetPos % COLS;

    // Wenn das Widget über den rechten Rand ragt
    if (startCol + w > COLS) return true;
    // Wenn das Widget über den unteren Rand ragt
    if (startRow + h > ROWS) return true;

    // 2. Kollision mit anderen Widgets prüfen
    const occupiedByOthers = new Set<number>();

    allWidgets.forEach((w) => {
        if (w.id === ignoreWidgetId) return;
        getOccupiedIndices(w.position, w.size).forEach((idx) => occupiedByOthers.add(idx));
    });

    return targetIndices.some((idx) => occupiedByOthers.has(idx));
};