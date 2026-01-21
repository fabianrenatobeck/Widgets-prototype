'use client';

import React, { useState, CSSProperties } from 'react';
import styles from './Display.module.css';
import { WidgetInstance, WidgetType, WidgetSize } from '@/types';
import WidgetSelector from '@/components/EditUI/WidgetSelector';
import GridSlot from '@/components/GridSlot/GridSlot';
import DesignMenu from '@/components/DesignMenu/DesignMenu'; // NEU IMPORTIEREN
import {
    TOTAL_SLOTS,
    COLS,
    getOccupiedIndices,
    hasCollision,
    getSizeDims
} from '@/utils/gridLogic';

// Wir erweitern das CSSProperties Interface für TypeScript, damit es Variablen akzeptiert
interface CustomCSS extends CSSProperties {
    '--display-bg'?: string;
    '--widget-bg'?: string;
}

export default function Display() {
    const [isEditMode, setIsEditMode] = useState(false);
    const [isDesignOpen, setIsDesignOpen] = useState(false); // NEUER STATE

    // Farben State (Standardwerte)
    const [displayBg, setDisplayBg] = useState('#0a192f');
    const [widgetColor, setWidgetColor] = useState('#60a5fa');

    const [widgets, setWidgets] = useState<WidgetInstance[]>([]);
    const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);

    const handleDelete = (id: string) => {
        setWidgets((prev) => prev.filter((w) => w.id !== id));
    };

    const handleResize = (id: string, direction: 'top' | 'bottom' | 'left' | 'right') => {
        // ... (Code bleibt identisch zum vorherigen Schritt)
        // Damit ich nicht alles wiederholen muss: Hier kommt exakt die Logik von oben rein.
        // Falls du den Code kopierst, nimm die handleResize Logik aus dem vorherigen Schritt!
        const widget = widgets.find((w) => w.id === id);
        if (!widget) return;
        const { w, h } = getSizeDims(widget.size);
        let newW = w; let newH = h; let newPos = widget.position;
        if (direction === 'right') { newW = w === 1 ? 2 : 1; }
        else if (direction === 'bottom') { newH = h === 1 ? 2 : 1; }
        else if (direction === 'left') {
            if (w === 1) { newPos = widget.position - 1; newW = 2; if (widget.position % COLS === 0) return; }
            else { newPos = widget.position + 1; newW = 1; }
        }
        else if (direction === 'top') {
            if (h === 1) { newPos = widget.position - COLS; newH = 2; if (widget.position < COLS) return; }
            else { newPos = widget.position + COLS; newH = 1; }
        }
        const newSizeStr = `${newW}x${newH}` as WidgetSize;
        if (newPos < 0 || newPos >= TOTAL_SLOTS) return;
        if (hasCollision(newPos, newSizeStr, widgets, id)) return;
        setWidgets((prev) => prev.map((w) => w.id === id ? { ...w, size: newSizeStr, position: newPos } : w));
    };

    const handleWidgetSelect = (type: WidgetType) => {
        if (selectedSlotIndex === null) return;
        const newWidget: WidgetInstance = {
            id: crypto.randomUUID(), type: type, position: selectedSlotIndex, size: '1x1',
        };
        setWidgets([...widgets, newWidget]);
        setSelectedSlotIndex(null);
    };

    const handleDragStart = (e: React.DragEvent, id: string, offsetX: number, offsetY: number) => {
        const dragData = JSON.stringify({ id, offsetX, offsetY });
        e.dataTransfer.setData('application/json', dragData);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };

    const handleDrop = (e: React.DragEvent, targetIndex: number) => {
        e.preventDefault();
        try {
            const dataStr = e.dataTransfer.getData('application/json');
            if (!dataStr) return;
            const { id, offsetX, offsetY } = JSON.parse(dataStr);
            const widget = widgets.find((w) => w.id === id);
            if (!widget) return;
            const targetRow = Math.floor(targetIndex / COLS);
            const targetCol = targetIndex % COLS;
            const newStartRow = targetRow - offsetY;
            const newStartCol = targetCol - offsetX;
            if (newStartRow < 0 || newStartCol < 0) return;
            if (newStartCol >= COLS) return;
            const newPosition = newStartRow * COLS + newStartCol;
            if (widget.position === newPosition) return;
            if (hasCollision(newPosition, widget.size, widgets, id)) return;
            setWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, position: newPosition } : w)));
        } catch (err) { console.error("Drop failed", err); }
    };

    const coveredIndices = new Set<number>();
    widgets.forEach(w => {
        getOccupiedIndices(w.position, w.size).forEach(idx => {
            if (idx !== w.position) coveredIndices.add(idx);
        });
    });

    return (
        <div
            className={styles.container}
            // HIER PASSEN WIR DIE CSS VARIABLEN DYNAMISCH AN
            style={{
                '--display-bg': displayBg,
                '--widget-bg': widgetColor,
            } as CustomCSS}
        >
            {selectedSlotIndex !== null && (
                <WidgetSelector
                    onSelect={handleWidgetSelect}
                    onClose={() => setSelectedSlotIndex(null)}
                />
            )}

            {/* NEUES MENÜ EINBINDEN */}
            <DesignMenu
                isOpen={isDesignOpen}
                onClose={() => setIsDesignOpen(false)}
                bgColors={{ bg: displayBg, setBg: setDisplayBg }}
                widgetColors={{ widget: widgetColor, setWidget: setWidgetColor }}
            />

            <div className={styles.header}>
                {/* DESIGN BUTTON (Nur sichtbar wenn nicht im Edit Mode, oder immer? Sagen wir immer) */}
                <button
                    className={styles.designButton}
                    onClick={() => setIsDesignOpen(!isDesignOpen)}
                >
                    Design
                </button>

                <button
                    className={`${styles.editButton} ${isEditMode ? styles.editActive : ''}`}
                    onClick={() => {
                        setIsEditMode(!isEditMode);
                        setSelectedSlotIndex(null);
                        setIsDesignOpen(false); // Design Menü zu wenn Edit an? Oder andersrum.
                    }}
                >
                    {isEditMode ? 'Done' : 'Edit'}
                </button>
            </div>

            <div className={styles.gridContainer}>
                {Array.from({ length: TOTAL_SLOTS }).map((_, index) => {
                    if (coveredIndices.has(index)) {
                        return <div key={`covered-${index}`} style={{ display: 'none' }} />;
                    }
                    const widget = widgets.find((w) => w.position === index);
                    if (widget) {
                        const { w, h } = getSizeDims(widget.size);
                        return (
                            <div
                                key={`widget-${widget.id}`}
                                style={{ gridColumn: `span ${w}`, gridRow: `span ${h}`, zIndex: 10 }}
                            >
                                <GridSlot
                                    widget={widget}
                                    isEditMode={isEditMode}
                                    onDelete={handleDelete}
                                    onResize={handleResize}
                                    onDragStart={handleDragStart}
                                />
                            </div>
                        );
                    }
                    if (isEditMode) {
                        return (
                            <div
                                key={`empty-${index}`}
                                className={styles.emptySlot}
                                onClick={() => setSelectedSlotIndex(index)}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, index)}
                            >
                                <span className={styles.plusIcon}>+</span>
                            </div>
                        );
                    }
                    return <div key={`spacer-${index}`} />;
                })}
            </div>
        </div>
    );
}