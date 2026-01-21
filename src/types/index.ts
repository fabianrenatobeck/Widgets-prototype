// src/types/index.ts

export type WidgetType = 'weather' | 'calendar' | 'timer';

export type WidgetSize = '1x1' | '1x2' | '2x1' | '2x2';

// Ein belegtes Widget auf dem Grid
export interface WidgetInstance {
    id: string; // Eindeutige ID (z.B. UUID)
    type: WidgetType;
    position: number; // Index im Grid (0 bis 11)
    size: WidgetSize;
}

// Konfiguration für verfügbare Widgets in der Auswahl
export interface WidgetConfig {
    type: WidgetType;
    label: string;
    component: React.FC; // Die React Komponente
}