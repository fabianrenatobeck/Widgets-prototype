import { WidgetConfig } from '@/types';
import WeatherWidget from './Weather/WeatherWidget';
import CalendarWidget from './Calendar/CalendarWidget';
import TimerWidget from './Timer/TimerWidget';

export const AVAILABLE_WIDGETS: WidgetConfig[] = [
    {
        type: 'weather',
        label: 'Wetter',
        component: WeatherWidget,
    },
    {
        type: 'calendar',
        label: 'Kalender',
        component: CalendarWidget,
    },
    {
        type: 'timer',
        label: 'Timer',
        component: TimerWidget,
    },
];

export const getWidgetComponent = (type: string) => {
    const widget = AVAILABLE_WIDGETS.find((w) => w.type === type);
    return widget ? widget.component : () => null;
};