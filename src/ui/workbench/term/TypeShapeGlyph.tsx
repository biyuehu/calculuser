import type { JSX } from "solid-js";
import { type Ty, formatTy } from "../../../engine";

interface TypeShapeGlyphProps {
	readonly shape: Ty;
	readonly size?: number;
}

export function TypeShapeGlyph(props: TypeShapeGlyphProps): JSX.Element {
	return <span class="nameplate-type-token">{formatTy(props.shape)}</span>;
}
