import type { RendererFor } from "@/render/types";
import type { TemplateId } from "@/store/types";
import { renderCover } from "./cover";
import { renderGraphic } from "./graphic";
import { renderInfo } from "./info";
import { renderMultiPhoto } from "./multiPhoto";
import { renderPhoto } from "./photo";

export const TEMPLATE_RENDERERS: { [K in TemplateId]: RendererFor<K> } = {
  cover: renderCover,
  photo: renderPhoto,
  "multi-photo": renderMultiPhoto,
  graphic: renderGraphic,
  info: renderInfo,
};
