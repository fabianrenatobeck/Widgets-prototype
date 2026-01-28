import React, { useRef, useEffect, useState } from 'react';
import styles from './ContextMenu.module.css';

interface ContextMenuProps {
    x: number;
    y: number;
    containerRef: React.RefObject<HTMLDivElement | null>;
    onSelectDesign: () => void;
    onSelectWidgets: () => void;
    onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
                                                     x,
                                                     y,
                                                     containerRef,
                                                     onSelectDesign,
                                                     onSelectWidgets,
                                                     onClose
                                                 }) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [adjustedPos, setAdjustedPos] = useState({ x, y });

    useEffect(() => {
        if (menuRef.current && containerRef.current) {
            const menuRect = menuRef.current.getBoundingClientRect();
            const containerRect = containerRef.current.getBoundingClientRect();

            let newX = x;
            let newY = y;

            // Position berechnen
            const localX = x - containerRect.left;
            const localY = y - containerRect.top;

            if (localX + menuRect.width > containerRect.width) {
                newX = localX - menuRect.width;
            } else {
                newX = localX;
            }

            if (localY + menuRect.height > containerRect.height) {
                newY = localY - menuRect.height;
            } else {
                newY = localY;
            }

            setAdjustedPos({ x: newX, y: newY });
        }
    }, [x, y, containerRef]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent | TouchEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        // Wir nutzen 'mousedown' und 'touchstart' global, um Klicks außerhalb zu erkennen
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [onClose]);

    return (
        <div
            ref={menuRef}
            className={styles.menu}
            style={{ left: adjustedPos.x, top: adjustedPos.y }}
            // WICHTIG: Das hier verhindert, dass der Klick zum Display durchgeht
            // und das Menü sofort schließt, bevor der Button-Click feuert.
            onPointerDown={(e) => e.stopPropagation()}
        >
            <button className={styles.menuItem} onClick={onSelectWidgets}>
                <span>✏️</span> Widgets
            </button>
            <button className={styles.menuItem} onClick={onSelectDesign}>
                <span>🎨</span> Design
            </button>
        </div>
    );
};

export default ContextMenu;