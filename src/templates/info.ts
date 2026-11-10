import { drawShadow } from "@/render/shadow";
import type { RendererFor } from "@/render/types";
import type { InfoFields } from "@/store/draft";
import { INFO_CARD, LIBRARY_TEXTURE } from "./constants";
import type { TemplateDefinition } from "./definition";

/**
 * Info: event details on a card. docs/template-spec.md#info-info
 * The card and its shadow are final; badge and text land in #10.
 */
const renderInfo: RendererFor<"info"> = (ctx) => {
  const r = INFO_CARD.rect;
  drawShadow(ctx, r);
  ctx.fillStyle = INFO_CARD.fill;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  return [];
};

const emptyInfo = (): InfoFields => ({
  eventNumber: null,
  title: "",
  body: "",
  date: "",
  startTime: "",
  endTime: "",
  location: "",
});

export const infoTemplate: TemplateDefinition<"info"> = {
  id: "info",
  label: "Info",
  defaultTexture: LIBRARY_TEXTURE.plasterWhite,
  newDraft: (base) => ({ ...base, template: "info", info: emptyInfo() }),
  missingInputs: ({ info }) => {
    const missing: string[] = [];
    if (info.eventNumber === null) missing.push("event number");
    if (!info.title.trim()) missing.push("title");
    if (!info.date) missing.push("date");
    if (!info.startTime) missing.push("start time");
    if (!info.location.trim()) missing.push("location");
    return missing;
  },
  toPost: ({ info, texture }) =>
    info.eventNumber === null
      ? null
      : {
          template: "info",
          eventNumber: info.eventNumber,
          title: info.title,
          body: info.body,
          date: info.date,
          startTime: info.startTime,
          ...(info.endTime ? { endTime: info.endTime } : {}),
          location: info.location,
          texture,
        },
  fromPost: (post, base) => ({
    ...base,
    template: "info",
    info: {
      eventNumber: post.eventNumber,
      title: post.title,
      body: post.body,
      date: post.date,
      startTime: post.startTime,
      endTime: post.endTime ?? "",
      location: post.location,
    },
  }),
  photoIds: () => [],
  clearPhoto: (draft) => draft,
  render: renderInfo,
};
