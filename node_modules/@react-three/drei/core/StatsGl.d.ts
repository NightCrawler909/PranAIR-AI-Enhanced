import * as React from 'react';
import Stats from 'stats-gl';
type Props = Partial<Stats> & {
    showPanel?: number;
    className?: string;
    parent?: React.RefObject<HTMLElement>;
};
export declare function StatsGl({ className, parent, ...props }: Props): null;
export {};
