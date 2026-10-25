import type { ComponentType } from "react";
import Messages from "./Messages";
import Kakao from "./Kakao";
import PhoneApp, { ContactsApp } from "./PhoneApp";
import Insta from "./Insta";
import Notes from "./Notes";
import Safari from "./Safari";
import Music from "./Music";
import Photos from "./Photos";
import Bank from "./Bank";
import CashWalk from "./CashWalk";
import Health from "./Health";
import VoiceMemos from "./VoiceMemos";
import Jobs from "./Jobs";
import { Calendar, Clock, Weather, Calculator, Maps, CameraApp, Settings } from "./Misc";

/** light: 밝은 배경 앱 (상태바 검정 글자) */
export const APPS: Record<string, { label: string; C: ComponentType; light: boolean }> = {
  phone: { label: "전화", C: PhoneApp, light: true },
  messages: { label: "메시지", C: Messages, light: true },
  safari: { label: "Safari", C: Safari, light: true },
  music: { label: "음악", C: Music, light: true },
  kakao: { label: "카카오톡", C: Kakao, light: true },
  insta: { label: "Instagram", C: Insta, light: true },
  photos: { label: "사진", C: Photos, light: true },
  calendar: { label: "캘린더", C: Calendar, light: true },
  notes: { label: "메모", C: Notes, light: true },
  contacts: { label: "연락처", C: ContactsApp, light: true },
  bank: { label: "뱅킹", C: Bank, light: true },
  cashwalk: { label: "캐시워크", C: CashWalk, light: true },
  health: { label: "건강", C: Health, light: true },
  voicememos: { label: "음성 메모", C: VoiceMemos, light: true },
  jobs: { label: "업무", C: Jobs, light: true },
  maps: { label: "지도", C: Maps, light: true },
  clock: { label: "시계", C: Clock, light: false },
  weather: { label: "날씨", C: Weather, light: false },
  calculator: { label: "계산기", C: Calculator, light: false },
  camera: { label: "카메라", C: CameraApp, light: false },
  settings: { label: "설정", C: Settings, light: true },
};
