import React from 'react';
import styles from './GridSlot.module.css';
import { WidgetInstance, WidgetSize } from '@/types';
import { getWidgetComponent } from '@/widgets';
import { getSizeDims } from '@/utils/gridLogic';

interface GridSlotProps {
    widget: WidgetInstance;
    isEditMode: boolean;
    onDelete: (id: string) => void;
    onResize: (id: string, direction: 'top' | 'bottom' | 'left' | 'right') => void;
    // DragStart übergibt jetzt auch den Offset (wo wir angefasst haben)
    onDragStart: (e: React.DragEvent, id: string, offsetX: number, offsetY: number) => void;
}

const GridSlot: React.FC<GridSlotProps> = ({
                                               widget,
                                               isEditMode,
                                               onDelete,
                                               onResize,
                                               onDragStart
                                           }) => {
    const WidgetComponent = getWidgetComponent(widget.type);

    const handleDragStartInternal = (e: React.DragEvent) => {
        // 1. Wir holen uns die Abmessungen des angeklickten HTML Elements
        const rect = (e.target as HTMLElement).getBoundingClientRect();

        // 2. Wo haben wir geklickt (relativ zur linken oberen Ecke des Widgets)?
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        // 3. Wie groß ist eine Zelle ungefähr?
        // Da wir wissen, wie groß das Widget ist (z.B. 2 breit), teilen wir die Breite durch die Grid-Breite
        const { w, h } = getSizeDims(widget.size);
        const cellWidth = rect.width / w;
        const cellHeight = rect.height / h;

        // 4. Offset berechnen (0 oder 1)
        const offsetX = Math.floor(clickX / cellWidth);
        const offsetY = Math.floor(clickY / cellHeight);

        onDragStart(e, widget.id, offsetX, offsetY);
    };

    return (
        <div
            className={`${styles.container} ${
                isEditMode ? styles.modeEdit : styles.modeView
            }`}
            draggable={isEditMode}
            onDragStart={handleDragStartInternal}
        >
            <div className={styles.content}>
                <WidgetComponent />
            </div>

            {isEditMode && (
                <>
                    <button
                        className={styles.deleteBtn}
                        onClick={(e) => { e.stopPropagation(); onDelete(widget.id); }}
                    >✕</button>

                    {/* Alle 4 Handles */}
                    <div
                        className={`${styles.resizeHandle} ${styles.handleRight}`}
                        onClick={(e) => { e.stopPropagation(); onResize(widget.id, 'right'); }}
                    />
                    <div
                        className={`${styles.resizeHandle} ${styles.handleBottom}`}
                        onClick={(e) => { e.stopPropagation(); onResize(widget.id, 'bottom'); }}
                    />
                    <div
                        className={`${styles.resizeHandle} ${styles.handleLeft}`}
                        onClick={(e) => { e.stopPropagation(); onResize(widget.id, 'left'); }}
                    />
                    <div
                        className={`${styles.resizeHandle} ${styles.handleTop}`}
                        onClick={(e) => { e.stopPropagation(); onResize(widget.id, 'top'); }}
                    />
                </>
            )}
        </div>
    );
};

export default GridSlot;