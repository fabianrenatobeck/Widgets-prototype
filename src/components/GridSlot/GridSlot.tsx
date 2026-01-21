import React from 'react';
import styles from './GridSlot.module.css';
import { WidgetInstance, WidgetSize } from '@/types';
import { getWidgetComponent } from '@/widgets';

interface GridSlotProps {
    widget: WidgetInstance;
    isEditMode: boolean;
    onDelete: (id: string) => void;
    onResize: (id: string, newSize: WidgetSize) => void;
    // Drag & Drop Props
    onDragStart: (e: React.DragEvent, id: string) => void;
}

const GridSlot: React.FC<GridSlotProps> = ({
                                               widget,
                                               isEditMode,
                                               onDelete,
                                               onResize,
                                               onDragStart
                                           }) => {
    const WidgetComponent = getWidgetComponent(widget.type);

    // Logik für Resizing
    const handleResize = (direction: 'horizontal' | 'vertical') => {
        let newW = parseInt(widget.size[0]);
        let newH = parseInt(widget.size[2]);

        // Einfache Toggle Logik: 1->2 oder 2->1
        if (direction === 'horizontal') {
            newW = newW === 1 ? 2 : 1;
        } else {
            newH = newH === 1 ? 2 : 1;
        }

        const newSize = `${newW}x${newH}` as WidgetSize;
        onResize(widget.id, newSize);
    };

    return (
        <div
            className={`${styles.container} ${
                isEditMode ? styles.modeEdit : styles.modeView
            }`}
            draggable={isEditMode}
            onDragStart={(e) => onDragStart(e, widget.id)}
        >
            <div className={styles.content}>
                <WidgetComponent />
            </div>

            {isEditMode && (
                <>
                    {/* Delete Button */}
                    <button
                        className={styles.deleteBtn}
                        onClick={(e) => {
                            e.stopPropagation(); // Verhindert Drag Start beim Klicken
                            onDelete(widget.id);
                        }}
                    >
                        ✕
                    </button>

                    {/* Resize Handle: Rechts (Nur Breite ändern) */}
                    <div
                        className={`${styles.resizeHandle} ${styles.handleRight}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleResize('horizontal');
                        }}
                        title="Breite ändern"
                    />

                    {/* Resize Handle: Unten (Nur Höhe ändern) */}
                    <div
                        className={`${styles.resizeHandle} ${styles.handleBottom}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleResize('vertical');
                        }}
                        title="Höhe ändern"
                    />
                </>
            )}
        </div>
    );
};

export default GridSlot;