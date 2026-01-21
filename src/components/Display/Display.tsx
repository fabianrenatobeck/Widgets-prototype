'use client';

import React, { useState } from 'react';
import styles from './Display.module.css';
import { WidgetInstance, WidgetType, WidgetSize } from '@/types';
import WidgetSelector from '@/components/EditUI/WidgetSelector';
import GridSlot from '@/components/GridSlot/GridSlot';
import {
    TOTAL_SLOTS,
    COLS,
    getOccupiedIndices,
    hasCollision,
    getSizeDims
} from '@/utils/gridLogic';

export default function Display() {
    const [isEditMode, setIsEditMode] = useState(false);
    const [widgets, setWidgets] = useState<WidgetInstance[]>([]);
    const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);

    // --- ACTIONS ---

    const handleDelete = (id: string) => {
        setWidgets((prev) => prev.filter((w) => w.id !== id));
    };

    const handleResize = (id: string, newSize: WidgetSize) => {
        const widget = widgets.find((w) => w.id === id);
        if (!widget) return;

        // Prüfen ob die neue Größe kollidiert
        if (hasCollision(widget.position, newSize, widgets, id)) {
            alert("Nicht genug Platz!"); // Einfaches Feedback
            return;
        }

        setWidgets((prev) =>
            prev.map((w) => w.id === id ? { ...w, size: newSize } : w)
        );
    };

    const handleWidgetSelect = (type: WidgetType) => {
        if (selectedSlotIndex === null) return;

        const newWidget: WidgetInstance = {
            id: crypto.randomUUID(),
            type: type,
            position: selectedSlotIndex,
            size: '1x1',
        };

        setWidgets([...widgets, newWidget]);
        setSelectedSlotIndex(null);
    };

    // --- DRAG & DROP LOGIC ---

    const handleDragStart = (e: React.DragEvent, id: string) => {
        // Wir speichern die ID des gezogenen Elements
        e.dataTransfer.setData('text/plain', id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        // Erlauben Drop
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent, targetIndex: number) => {
        e.preventDefault();
        const draggedId = e.dataTransfer.getData('text/plain');
        const widget = widgets.find((w) => w.id === draggedId);

        if (!widget) return;
        if (widget.position === targetIndex) return; // Gleiche Stelle

        // Prüfen ob am Ziel Platz ist für die Größe des Widgets
        if (hasCollision(targetIndex, widget.size, widgets, draggedId)) {
            return; // Drop ignorieren wenn kein Platz
        }

        // Update Position
        setWidgets((prev) =>
            prev.map((w) => (w.id === draggedId ? { ...w, position: targetIndex } : w))
        );
    };

    // --- RENDERING HELPERS ---

    // Wir erstellen eine "Map" des Grids, um zu wissen, welche Zellen übersprungen werden müssen
    // (weil sie von einem großen Widget verdeckt werden)
    const coveredIndices = new Set<number>();
    widgets.forEach(w => {
        const indices = getOccupiedIndices(w.position, w.size);
        // Der Start-Index (w.position) wird normal gerendert,
        // aber alle ANDEREN Indizes müssen als "versteckt" markiert werden.
        indices.forEach(idx => {
            if (idx !== w.position) coveredIndices.add(idx);
        });
    });

    return (
        <div className={styles.container}>
            {selectedSlotIndex !== null && (
                <WidgetSelector
                    onSelect={handleWidgetSelect}
                    onClose={() => setSelectedSlotIndex(null)}
                />
            )}

            <div className={styles.header}>
                <button
                    className={`${styles.editButton} ${isEditMode ? styles.editActive : ''}`}
                    onClick={() => {
                        setIsEditMode(!isEditMode);
                        setSelectedSlotIndex(null);
                    }}
                >
                    {isEditMode ? 'Done' : 'Edit'}
                </button>
            </div>

            <div className={styles.gridContainer}>
                {Array.from({ length: TOTAL_SLOTS }).map((_, index) => {

                    // 1. Wenn dieser Slot von einem Widget verdeckt wird (z.B. Index 1 bei einem 2x1 Widget auf 0)
                    // Rendern wir gar nichts, damit CSS Grid das Layout nicht zerschießt.
                    if (coveredIndices.has(index)) {
                        // WICHTIG: Wir müssen trotzdem ein leeres div rendern oder die Grid-Positionierung manuell machen.
                        // Bei CSS Grid mit "Auto Flow" würde ein fehlendes Div alles verschieben.
                        // Aber da wir unten "gridColumn / gridRow" explizit setzen für Widgets,
                        // nutzen wir für die leeren Slots einfach Platzhalter.
                        // Strategie: Wir nutzen hier eine "unsichtbare" Zelle, die aber 0x0 groß ist,
                        // damit sie im Flow nicht stört, falls wir row/col manuell setzen.
                        // NOCH BESSER: Wir nutzen die `grid-column-start` Logik.
                        // Da wir Widgets explizit platzieren, müssen wir leere Zellen auch explizit lassen?
                        // Einfachste Lösung: Ein leeres Div rendern, das aber vom Widget überlagert wird?
                        // Nein. Wir rendern NICHTS an dieser Stelle im Array.
                        return <div key={`covered-${index}`} style={{ display: 'none' }} />;
                    }

                    const widget = widgets.find((w) => w.position === index);

                    // FALL A: Widget startet hier
                    if (widget) {
                        const { w, h } = getSizeDims(widget.size);
                        return (
                            <div
                                key={`widget-${widget.id}`}
                                style={{
                                    gridColumn: `span ${w}`,
                                    gridRow: `span ${h}`,
                                    zIndex: 10
                                }}
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

                    // FALL B: Leerer Slot (und nicht verdeckt)
                    // Edit Mode: Zeige Plus
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

                    // FALL C: View Mode Leer
                    // Einfacher Platzhalter
                    return <div key={`spacer-${index}`} />;
                })}
            </div>
        </div>
    );
}