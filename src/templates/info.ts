import { drawShadow } from "@/render/shadow";
import {
  drawLines,
  fitBlock,
  fitHeadline,
  fitLine,
  fitWarnings,
  type TextFit,
} from "@/render/text";
import type { FitWarning, RendererFor } from "@/render/types";
import { drawWordmark } from "@/render/wordmark";
import type { DraftFor, InfoFields } from "@/store/draft";
import {
  INFO_BADGE,
  INFO_BODY,
  INFO_CARD,
  INFO_DATE,
  INFO_LOCATION,
  INFO_LOCKUP,
  INFO_RULES,
  INFO_TEXT_COLOR,
  INFO_TITLE,
  LIBRARY_TEXTURE,
} from "./constants";
import type { TemplateDefinition } from "./definition";
import { formatEventDate } from "./infoDate";
import { InfoEditor } from "./InfoEditor";

type Ctx = CanvasRenderingContext2D;

/** A centred single line that shrinks to fit (the date and location lines). */
function drawDetailLine(
  ctx: Ctx,
  text: string,
  spec: typeof INFO_DATE | typeof INFO_LOCATION,
): TextFit {
  const fit = fitLine(ctx, text, { ...spec, maxSize: spec.size });
  drawLines(ctx, fit.lines, {
    font: spec.font,
    size: fit.size,
    lineHeight: fit.lineHeight,
    x: spec.centerX,
    baseline: spec.baseline,
    align: "center",
    color: INFO_TEXT_COLOR,
  });
  return fit;
}

function drawCard(ctx: Ctx): void {
  const r = INFO_CARD.rect;
  drawShadow(ctx, r);
  ctx.fillStyle = INFO_CARD.fill;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.fillStyle = INFO_RULES.color;
  for (const y of INFO_RULES.ys) {
    ctx.fillRect(INFO_RULES.x, y - INFO_RULES.thickness / 2, INFO_RULES.w, INFO_RULES.thickness);
  }
}

/** The fixed "chapter presents" line. */
function drawLockup(ctx: Ctx, wordmark: Parameters<typeof drawWordmark>[1] | undefined): void {
  if (wordmark) drawWordmark(ctx, wordmark, INFO_LOCKUP.wordmark, INFO_TEXT_COLOR);
  const p = INFO_LOCKUP.presents;
  drawLines(ctx, [p.text], {
    font: p.font,
    size: p.size,
    lineHeight: p.size,
    x: p.x,
    baseline: p.baseline,
    align: "left",
    color: INFO_TEXT_COLOR,
    strokeWidth: p.strokeWidth,
  });
}

function drawTitle(ctx: Ctx, title: string): TextFit {
  const t = INFO_TITLE;
  const fit = fitHeadline(ctx, title, { ...t, maxSize: t.size });
  drawLines(ctx, fit.lines, {
    font: t.font,
    size: fit.size,
    lineHeight: fit.lineHeight,
    x: t.centerX,
    baseline: fit.lines.length > 1 ? t.wrappedBaseline : t.baseline,
    align: "center",
    color: INFO_TEXT_COLOR,
  });
  return fit;
}

/** Left-aligned body, centred as a block between the two rules. */
function drawBody(ctx: Ctx, body: string): TextFit {
  const b = INFO_BODY;
  const fit = fitBlock(ctx, body, { ...b, maxSize: b.size });
  const firstBaseline =
    b.centerY - ((fit.lines.length - 1) * fit.lineHeight) / 2 + fit.size * b.baselineShiftEm;
  drawLines(ctx, fit.lines, {
    font: b.font,
    size: fit.size,
    lineHeight: fit.lineHeight,
    x: b.x,
    baseline: firstBaseline,
    align: "left",
    color: INFO_TEXT_COLOR,
  });
  return fit;
}

/** The `ch. N` badge, drawn last so it overlaps the card's corner. */
function drawBadge(ctx: Ctx, eventNumber: number | null): TextFit {
  const b = INFO_BADGE;
  ctx.save();
  ctx.beginPath();
  ctx.arc(b.centerX, b.centerY, b.diameter / 2, 0, Math.PI * 2);
  ctx.fillStyle = b.fill;
  ctx.fill();
  ctx.strokeStyle = b.stroke;
  ctx.lineWidth = b.strokeWidth;
  ctx.stroke();
  ctx.restore();

  const text = eventNumber === null ? "ch." : `ch. ${eventNumber}`;
  const fit = fitLine(ctx, text, { ...b.text, maxSize: b.text.size });
  drawLines(ctx, fit.lines, {
    font: b.text.font,
    size: fit.size,
    lineHeight: fit.lineHeight,
    x: b.centerX,
    baseline: b.text.baseline,
    align: "center",
    color: INFO_TEXT_COLOR,
  });
  return fit;
}

/** Info: event details on a card. docs/template-spec.md#info-info */
const renderInfo: RendererFor<"info"> = (ctx, draft, assets) => {
  const { info } = draft;
  drawCard(ctx);
  drawLockup(ctx, assets.wordmark);
  const warnings: FitWarning[] = [
    ...fitWarnings(
      drawTitle(ctx, info.title),
      "title",
      "The title is too long, even on two lines.",
    ),
    ...fitWarnings(drawBody(ctx, info.body), "body", "The body text is too long to fit."),
    ...fitWarnings(
      drawDetailLine(ctx, formatEventDate(info.date, info.startTime, info.endTime), INFO_DATE),
      "date",
      "The date line is too long to fit.",
    ),
    ...fitWarnings(
      drawDetailLine(ctx, info.location, INFO_LOCATION),
      "location",
      "The location is too long for one line.",
    ),
    ...fitWarnings(
      drawBadge(ctx, info.eventNumber),
      "eventNumber",
      "The event number doesn't fit in the badge.",
    ),
  ];
  return warnings;
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

/** The inputs of the reference render, `docs/reference/info.png`. */
const referenceInfo = (): InfoFields => ({
  eventNumber: 1,
  title: "Recess At Night!",
  body: "Take a break from all the hard work and wintertime blues, and come play for an evening. Join us at Anew Café & Goods for a recess session designed for adults who haven't forgotten the joy of recess.",
  date: "2026-03-10",
  startTime: "18:30",
  endTime: "21:00",
  location: "Anew Café & Goods, New York, NY",
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
  draftPhotoIds: () => [],
  acceptPhoto: (draft) => draft,
  clearPhoto: (draft) => draft,
  hasTypedText: ({ info }) =>
    [info.title, info.body, info.location].some((text) => text.trim() !== ""),
  render: renderInfo,
  Editor: InfoEditor,
  fixture: (draft: DraftFor<"info">) => ({ ...draft, info: referenceInfo() }),
};
