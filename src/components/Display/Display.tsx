'use client';

import React, { useState, useEffect, useRef, CSSProperties } from 'react';
import styles from './Display.module.css';
import { WidgetInstance, WidgetType, WidgetSize } from '@/types';
import WidgetSelector from '@/components/EditUI/WidgetSelector';
import GridSlot from '@/components/GridSlot/GridSlot';
import DesignMenu from '@/components/DesignMenu/DesignMenu';
import ContextMenu from '@/components/ContextMenu/ContextMenu';
import {
    TOTAL_SLOTS,
    COLS,
    getOccupiedIndices,
    hasCollision,
    getSizeDims
} from '@/utils/gridLogic';

interface CustomCSS extends CSSProperties {
    '--display-bg'?: string;
    '--widget-bg'?: string;
}

interface DragState {
    isDragging: boolean;
    widgetId: string | null;
    offsetX: number;
    offsetY: number;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    initialGhostLeft: number;
    initialGhostTop: number;
    originalWidth: number;
    originalHeight: number;
}

// Zeit für Long Press in Millisekunden
const LONG_PRESS_DURATION = 600;

export default function Display() {
    const [isEditMode, setIsEditMode] = useState(false);
    const [isDesignOpen, setIsDesignOpen] = useState(false);
    const [displayBg, setDisplayBg] = useState('#0a192f');
    const [widgetColor, setWidgetColor] = useState('#60a5fa');

    // Context Menu State
    const [contextMenu, setContextMenu] = useState<{ isOpen: boolean; x: number; y: number } | null>(null);

    const [widgets, setWidgets] = useState<WidgetInstance[]>([]);
    const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);

    const [dragState, setDragState] = useState<DragState>({
        isDragging: false,
        widgetId: null,
        offsetX: 0, offsetY: 0,
        startX: 0, startY: 0,
        currentX: 0, currentY: 0,
        initialGhostLeft: 0, initialGhostTop: 0,
        originalWidth: 0, originalHeight: 0
    });

    const gridRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Refs für Long Press Logik
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);
    const pressStartPosition = useRef<{ x: number, y: number } | null>(null);

    // --- LONG PRESS HANDLERS ---

    const startLongPressTimer = (e: React.PointerEvent) => {
        // Kontextmenü schließen bei neuem Klick
        if (contextMenu) setContextMenu(null);

        // Nur linke Maustaste oder Touch
        if (e.button !== 0) return;

        pressStartPosition.current = { x: e.clientX, y: e.clientY };

        longPressTimer.current = setTimeout(() => {
            // Timer hat ausgelöst!

            // Wenn wir gerade ein Widget draggen, ignorieren wir den Long Press auf Background
            // (Wir prüfen das über den State, aber da setTimeout asynchron ist, müssen wir aufpassen)
            // Lösung: Wir setzen voraus, dass PointerMove den Timer killt, wenn dragging startet.

            if (isEditMode) {
                // Im Edit Modus: Lange drücken beendet Edit Modus
                setIsEditMode(false);
            } else {
                // Im View Modus: Menü öffnen
                setContextMenu({
                    isOpen: true,
                    x: e.clientX,
                    y: e.clientY
                });
            }

            // Feedback Vibration (auf Mobile)
            if (navigator.vibrate) navigator.vibrate(50);

        }, LONG_PRESS_DURATION);
    };

    const cancelLongPress = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
        pressStartPosition.current = null;
    };

    const handleGlobalPointerMove = (e: React.PointerEvent) => {
        // Prüfen ob wir uns zu weit bewegt haben (dann ist es kein Long Press mehr)
        if (pressStartPosition.current) {
            const dist = Math.sqrt(
                Math.pow(e.clientX - pressStartPosition.current.x, 2) +
                Math.pow(e.clientY - pressStartPosition.current.y, 2)
            );
            if (dist > 10) { // 10px Toleranz
                cancelLongPress();
            }
        }
    };

    // --- WIDGET LOGIC ---

    const handleDelete = (id: string) => {
        setWidgets((prev) => prev.filter((w) => w.id !== id));
    };

    const handleResize = (id: string, direction: 'top' | 'bottom' | 'left' | 'right') => {
        // Reset Long Press falls aktiv
        cancelLongPress();

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

    // --- DRAG LOGIC ---

    const handlePointerDownWidget = (e: React.PointerEvent, id: string, offsetX: number, offsetY: number) => {
        if (!isEditMode) return;

        // Wenn Drag startet, muss der Long-Press-Exit Timer sofort sterben
        cancelLongPress();

        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setDragState({
            isDragging: true,
            widgetId: id,
            offsetX, offsetY,
            startX: e.clientX, startY: e.clientY,
            currentX: e.clientX, currentY: e.clientY,
            initialGhostLeft: rect.left, initialGhostTop: rect.top,
            originalWidth: rect.width, originalHeight: rect.height
        });
    };

    useEffect(() => {
        const handlePointerMove = (e: PointerEvent) => {
            // Drag Logic
            if (dragState.isDragging) {
                e.preventDefault();
                setDragState(prev => ({ ...prev, currentX: e.clientX, currentY: e.clientY }));
            }
        };

        const handlePointerUp = (e: PointerEvent) => {
            // 1. Long Press Cleanup (falls Finger gehoben bevor Timer fertig)
            cancelLongPress();

            // 2. Drag Logic
            if (!dragState.isDragging) return;

            const { widgetId, offsetX, offsetY, currentX, currentY } = dragState;
            setDragState(prev => ({ ...prev, isDragging: false, widgetId: null }));

            if (!gridRef.current || !widgetId) return;

            const gridRect = gridRef.current.getBoundingClientRect();

            if (currentX < gridRect.left || currentX > gridRect.right ||
                currentY < gridRect.top || currentY > gridRect.bottom) return;

            const relX = currentX - gridRect.left;
            const relY = currentY - gridRect.top;
            const cellWidth = gridRect.width / COLS;
            const cellHeight = gridRect.height / 6;
            const colIndex = Math.floor(relX / cellWidth);
            const rowIndex = Math.floor(relY / cellHeight);

            const newStartRow = rowIndex - offsetY;
            const newStartCol = colIndex - offsetX;

            if (newStartRow < 0 || newStartCol < 0 || newStartCol >= COLS) return;

            const newPosition = newStartRow * COLS + newStartCol;
            const widget = widgets.find(w => w.id === widgetId);

            if (!widget || widget.position === newPosition) return;
            if (hasCollision(newPosition, widget.size, widgets, widgetId)) return;

            setWidgets(prev => prev.map(w => w.id === widgetId ? { ...w, position: newPosition } : w));
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        window.addEventListener('pointercancel', handlePointerUp);

        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
            window.removeEventListener('pointercancel', handlePointerUp);
            // Cleanup Timer bei Unmount
            cancelLongPress();
        };
    }, [dragState, widgets, isEditMode]); // isEditMode dependency wichtig für Long Press Context

    // --- RENDER HELPERS ---

    const coveredIndices = new Set<number>();
    widgets.forEach(w => {
        getOccupiedIndices(w.position, w.size).forEach(idx => {
            if (idx !== w.position) coveredIndices.add(idx);
        });
    });

    const draggingWidget = widgets.find(w => w.id === dragState.widgetId);

    // Context Menu Actions
    const openEditMode = () => {
        setIsEditMode(true);
        setContextMenu(null);
    };

    const openDesignMode = () => {
        setIsDesignOpen(true);
        setContextMenu(null);
    };

    return (
        <div
            ref={containerRef}
            className={styles.container}
            style={{
                '--display-bg': displayBg,
                '--widget-bg': widgetColor,
            } as CustomCSS}
            // HIER SITZT DER HAUPT LISTENER FÜR LONG PRESS
            onPointerDown={startLongPressTimer}
            onPointerMove={handleGlobalPointerMove}
            // onPointerUp wird global über window im useEffect gecatched
            onContextMenu={(e) => e.preventDefault()} // Browser Rechtsklick unterdrücken
        >
            {/* GHOST RENDER LOGIK */}
            {dragState.isDragging && draggingWidget && (
                <div
                    className={styles.dragGhost}
                    style={{
                        width: dragState.originalWidth,
                        height: dragState.originalHeight,
                        left: dragState.initialGhostLeft,
                        top: dragState.initialGhostTop,
                        transform: `translate(${dragState.currentX - dragState.startX}px, ${dragState.currentY - dragState.startY}px)`
                    }}
                >
                    <GridSlot
                        widget={draggingWidget}
                        isEditMode={true}
                        onDelete={() => {}}
                        onResize={() => {}}
                        onPointerDown={() => {}}
                    />
                </div>
            )}

            {/* CONTEXT MENU POPUP */}
            {contextMenu && contextMenu.isOpen && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    containerRef={containerRef}
                    onSelectWidgets={openEditMode}
                    onSelectDesign={openDesignMode}
                    onClose={() => setContextMenu(null)}
                />
            )}

            {/* WIDGET SELECTOR */}
            {selectedSlotIndex !== null && (
                <WidgetSelector
                    onSelect={handleWidgetSelect}
                    onClose={() => setSelectedSlotIndex(null)}
                />
            )}

            {/* DESIGN SIDEBAR */}
            <DesignMenu
                isOpen={isDesignOpen}
                onClose={() => setIsDesignOpen(false)}
                bgColors={{ bg: displayBg, setBg: setDisplayBg }}
                widgetColors={{ widget: widgetColor, setWidget: setWidgetColor }}
            />

            {/* HEADER (NUR NOCH HINT) */}
            <div className={styles.header}>
                {isEditMode && (
                    <div className={styles.headerHint}>
                        Lange drücken zum Beenden
                    </div>
                )}
            </div>

            {/* GRID */}
            <div className={styles.gridContainer} ref={gridRef}>
                {Array.from({ length: TOTAL_SLOTS }).map((_, index) => {
                    if (coveredIndices.has(index)) return <div key={`covered-${index}`} style={{ display: 'none' }} />;

                    const widget = widgets.find((w) => w.position === index);

                    if (widget) {
                        const { w, h } = getSizeDims(widget.size);
                        const isBeingDragged = dragState.isDragging && dragState.widgetId === widget.id;

                        return (
                            <div
                                key={`widget-${widget.id}`}
                                style={{
                                    gridColumn: `span ${w}`,
                                    gridRow: `span ${h}`,
                                    zIndex: 10,
                                    opacity: isBeingDragged ? 0.2 : 1
                                }}
                            >
                                <GridSlot
                                    widget={widget}
                                    isEditMode={isEditMode}
                                    onDelete={handleDelete}
                                    onResize={handleResize}
                                    onPointerDown={handlePointerDownWidget}
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
                                // onPointerDown stoppt Propagation damit Long Press auf Empty Slot
                                // nicht das Kontext Menü öffnet? Nein, wir wollen Long Press auch hier erlauben.
                                // Also lassen wir es bubbeln.
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