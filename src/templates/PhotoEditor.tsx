import { createElement, type ComponentType } from "react";
import type { EditorProps } from "./definition";
import { PhotoSlotEditor } from "./PhotoSlotEditor";
import { TextCardEditor } from "./TextCardEditor";

/** The Photo form: the photo, then the optional text card. */
export function PhotoEditor(props: EditorProps<"photo">) {
  return (
    <div className="flex flex-col gap-3">
      {createElement(PhotoSlotEditor as ComponentType<EditorProps<"photo">>, props)}
      <TextCardEditor
        card={props.draft.textCard}
        onCard={(textCard) => props.onChange((d) => ({ ...d, textCard }))}
      />
    </div>
  );
}
