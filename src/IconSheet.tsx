/* #/icons — 앱 아이콘 모음 (아이콘을 실제 아이폰과 비교하며 고칠 때 보는 화면) */
import { AppIcon } from "./icons";
import { APPS } from "./apps";

export default function IconSheet() {
  return (
    <div className="min-h-full p-6" style={{ background: "linear-gradient(160deg,#3a4a6b,#1c2333)", overflow: "auto", height: "100%" }}>
      <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fill, 110px)" }}>
        {Object.keys(APPS).map((id) => (
          <div key={id} className="flex flex-col items-center gap-2">
            <AppIcon id={id} size={96} />
            <span className="text-white text-[13px]">{APPS[id].label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
