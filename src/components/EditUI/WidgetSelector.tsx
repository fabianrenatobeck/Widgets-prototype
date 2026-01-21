import React from 'react';
import styles from './WidgetSelector.module.css';
import { AVAILABLE_WIDGETS } from '@/widgets';
import { WidgetType } from '@/types';

interface WidgetSelectorProps {
    onSelect: (type: WidgetType) => void;
    onClose: () => void;
}

const WidgetSelector: React.FC<WidgetSelectorProps> = ({ onSelect, onClose }) => {
    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <h3 className={styles.title}>Widget hinzufügen</h3>

                {AVAILABLE_WIDGETS.map((widget) => (
                    <button
                        key={widget.type}
                        className={styles.optionButton}
                        onClick={() => onSelect(widget.type)}
                    >
                        {widget.label}
                    </button>
                ))}

                <button className={styles.closeButton} onClick={onClose}>
                    Abbrechen
                </button>
            </div>
        </div>
    );
};

export default WidgetSelector;