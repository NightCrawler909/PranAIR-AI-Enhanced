import { Vector2, Vector3, Color, ColorRepresentation } from 'three';
import { ReactThreeFiber } from '@react-three/fiber';
import { LineMaterial, LineMaterialParameters, Line2, LineSegments2 } from 'three-stdlib';
import { ForwardRefComponent } from '../helpers/ts-utils';
export type LineProps = {
    points: Array<Vector3 | Vector2 | [number, number, number] | [number, number] | number>;
    vertexColors?: Array<Color | [number, number, number] | [number, number, number, number]>;
    lineWidth?: number;
    segments?: boolean;
} & Omit<LineMaterialParameters, 'vertexColors' | 'color'> & Omit<ReactThreeFiber.Object3DNode<Line2, typeof Line2>, 'args'> & Omit<ReactThreeFiber.Object3DNode<LineMaterial, [LineMaterialParameters]>, 'color' | 'vertexColors' | 'args'> & {
    color?: ColorRepresentation;
};
export declare const Line: ForwardRefComponent<LineProps, Line2 | LineSegments2>;
