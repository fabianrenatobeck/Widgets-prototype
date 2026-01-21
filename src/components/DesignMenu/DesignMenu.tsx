import React from 'react';
import styles from './DesignMenu.module.css';

interface DesignMenuProps {
    isOpen: boolean;
    onClose: () => void;
    bgColors: { bg: string; setBg: (c: string) => void };
    widgetColors: { widget: string; setWidget: (c: string) => void };
}

const PRESET_BGS = ['#0a192f', '#000000', '#1a1a2e', '#2c3e50', '#4a148c'];
const PRESET_WIDGETS = ['#60a5fa', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const DesignMenu: React.FC<DesignMenuProps> = ({
                                                   isOpen,
                                                   onClose,
                                                   bgColors,
                                                   widgetColors
                                               }) => {
    return (
        <div className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
            <div className={styles.header}>
                <span>Design</span>
                <button onClick={onClose} className={styles.closeBtn}>✕</button>
            </div>

            {/* Hintergrund Sektion */}
            <div className={styles.section}>
                <span className={styles.label}>Hintergrund</span>
                <div className={styles.colorGrid}>
                    {PRESET_BGS.map(c => (
                        <button
                            key={c}
                            className={`${styles.colorOption} ${bgColors.bg === c ? styles.active : ''}`}
                            style={{ backgroundColor: c }}
                            onClick={() => bgColors.setBg(c)}
                        />
                    ))}
                </div>
                <div className={styles.colorInputContainer}>
                    <input
                        type="color"
                        value={bgColors.bg}
                        onChange={(e) => bgColors.setBg(e.target.value)}
                        className={styles.colorInput}
                    />
                    <span className={styles.hexValue}>{bgColors.bg}</span>
                </div>
            </div>

            <hr style={{ borderColor: 'rgba(255,255,255,0.1)', width: '100%' }} />

            {/* Widget Sektion */}
            <div className={styles.section}>
                <span className={styles.label}>Widgets</span>
                <div className={styles.colorGrid}>
                    {PRESET_WIDGETS.map(c => (
                        <button
                            key={c}
                            className={`${styles.colorOption} ${widgetColors.widget === c ? styles.active : ''}`}
                            style={{ backgroundColor: c }}
                            onClick={() => widgetColors.setWidget(c)}
                        />
                    ))}
                </div>
                <div className={styles.colorInputContainer}>
                    <input
                        type="color"
                        value={widgetColors.widget}
                        onChange={(e) => widgetColors.setWidget(e.target.value)}
                        className={styles.colorInput}
                    />
                    <span className={styles.hexValue}>{widgetColors.widget}</span>
                </div>
            </div>
        </div>
    );
};

export default DesignMenu;