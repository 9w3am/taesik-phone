/*
  사진 — 코드로 그린 이미지는 쓰지 않는다.
  사진은 제작자가 /editor 에서 직접 올린 것(data URL) 또는 외부 이미지 주소만 표시한다.
*/
import type { Photo } from "./store";

/** 사진 참조 → 이미지 URL. data URL / http 주소 / 사진 id. 없으면 "" */
export function photoSrc(ref: string, photos: Photo[]) {
  if (!ref) return "";
  if (ref.startsWith("data:") || ref.startsWith("http")) return ref;
  return photos.find((x) => x.id === ref)?.src || "";
}

/** 업로드 이미지를 축소해 data URL로 (LocalStorage 용량 절약) */
export function shrinkImage(file: File, max = 1000): Promise<string> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * k);
      c.height = Math.round(img.height * k);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      res(c.toDataURL("image/jpeg", 0.82));
      URL.revokeObjectURL(img.src);
    };
    img.onerror = rej;
    img.src = URL.createObjectURL(file);
  });
}
