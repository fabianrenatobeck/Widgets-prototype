import React from 'react';
import styles from './GridSlot.module.css';
import { WidgetInstance } from '@/types';
import { getWidgetComponent } from '@/widgets';
import { getSizeDims } from '@/utils/gridLogic';

interface GridSlotProps {
    widget: WidgetInstance;
    isEditMode: boolean;
    onDelete: (id: string) => void;
    onResize: (id: string, direction: 'top' | 'bottom' | 'left' | 'right') => void;
    // Wir nutzen PointerDown statt DragStart für besseren Touch Support
    onPointerDown: (e: React.PointerEvent, id: string, offsetX: number, offsetY: number) => void;
}

const GridSlot: React.FC<GridSlotProps> = ({
                                               widget,
                                               isEditMode,
                                               onDelete,
                                               onResize,
                                               onPointerDown
                                           }) => {
    const WidgetComponent = getWidgetComponent(widget.type);

    const handlePointerDownInternal = (e: React.PointerEvent) => {
        // Verhindert Standard-Verhalten (Scrollen/Textmarkieren)
        // e.preventDefault(); // Manchmal besser dies im globalen Listener zu haben

        // Position im Grid berechnen (für die spätere Drop-Logik)
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        const { w, h } = getSizeDims(widget.size);
        // Grid-Offset berechnen (wo im Widget wurde geklickt: Zelle 0,0 oder 0,1?)
        const cellWidth = rect.width / w;
        const cellHeight = rect.height / h;
        const offsetX = Math.floor(clickX / cellWidth);
        const offsetY = Math.floor(clickY / cellHeight);

        onPointerDown(e, widget.id, offsetX, offsetY);
    };

    // Hilfsfunktion für Buttons: Stoppt das Event, damit kein Drag startet
    const stopPropagation = (e: React.PointerEvent | React.MouseEvent) => {
        e.stopPropagation();
    };

    return (
        <div
            className={`${styles.container} ${isEditMode ? styles.modeEdit : styles.modeView}`}
            onPointerDown={isEditMode ? handlePointerDownInternal : undefined}
            // touch-action none ist wichtig für Pointer Events auf Mobile
            style={{ touchAction: 'none' }}
        >
            <div className={styles.content}>
                <WidgetComponent />
            </div>

            {isEditMode && (
                <>
                    <button
                        className={styles.deleteBtn}
                        onPointerDown={stopPropagation} // WICHTIG: Kein Drag beim Löschen
                        onClick={() => onDelete(widget.id)}
                    >✕</button>

                    {/* Resize Handles: Auch hier Propagation stoppen */}
                    <div
                        className={`${styles.resizeHandle} ${styles.handleRight}`}
                        onPointerDown={stopPropagation} // WICHTIG: Kein Drag beim Resizen
                        onClick={() => onResize(widget.id, 'right')}
                    />
                    <div
                        className={`${styles.resizeHandle} ${styles.handleBottom}`}
                        onPointerDown={stopPropagation}
                        onClick={() => onResize(widget.id, 'bottom')}
                    />
                    <div
                        className={`${styles.resizeHandle} ${styles.handleLeft}`}
                        onPointerDown={stopPropagation}
                        onClick={() => onResize(widget.id, 'left')}
                    />
                    <div
                        className={`${styles.resizeHandle} ${styles.handleTop}`}
                        onPointerDown={stopPropagation}
                        onClick={() => onResize(widget.id, 'top')}
                    />
                </>
            )}
        </div>
    );
};

export default GridSlot;