const GUIDE_ROWS = [
  {
    scene: "鲜艳动画 / 漫画 / 游戏截图",
    algorithm: "HSL Atkinson",
    dither: "Atkinson",
    enhance: "0–50%",
  },
  {
    scene: "风景照（渐变为主）",
    algorithm: "HSL Atkinson",
    dither: "Atkinson",
    enhance: "50%",
  },
  {
    scene: "人物照片（有肤色）",
    algorithm: "HSL Bayer",
    dither: "4×4 Bayer",
    enhance: "0–50%",
  },
  {
    scene: "淡彩插画 / logo / 文字",
    algorithm: "HSL Bayer",
    dither: "4×4 Bayer",
    enhance: "50%",
  },
  {
    scene: "黑白照 / 线稿",
    algorithm: "Redmean",
    dither: "Floyd–Steinberg",
    enhance: "偏灰时 50–100%",
  },
] as const;

export default function GuideSection() {
  return (
    <details className="group mt-4">
      <summary className="cursor-pointer select-none text-sm noto-sans text-neutral-400 hover:text-neutral-200 transition-colors">
        这么多算法和抖动，我该选哪个？
      </summary>

      <div className="bg-layer p-3 mt-2 space-y-4 noto-sans text-xs text-neutral-400 leading-relaxed">
        {/* 速查表 */}
        <table className="w-full text-left">
          <thead>
            <tr className="text-neutral-300">
              <th className="pb-1.5 pr-3 font-normal">画面类型</th>
              <th className="pb-1.5 pr-3 font-normal">算法</th>
              <th className="pb-1.5 pr-3 font-normal">抖动</th>
              <th className="pb-1.5 font-normal">增强</th>
            </tr>
          </thead>
          <tbody>
            {GUIDE_ROWS.map((row) => (
              <tr key={row.scene} className="border-t border-white/5">
                <td className="py-1.5 pr-3 text-neutral-300">{row.scene}</td>
                <td className="py-1.5 pr-3">{row.algorithm}</td>
                <td className="py-1.5 pr-3">{row.dither}</td>
                <td className="py-1.5">{row.enhance}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 三个判断维度 */}
        <div className="space-y-2.5">
          <h2 className="text-sm text-neutral-200 font-normal">判断依据</h2>

          <div>
            <p className="text-neutral-300 mb-0.5">彩色程度</p>
            <p>
              鲜艳画面用{" "}
              <span className="text-neutral-300">HSL Atkinson</span>
              {" "}
              （色相保留最强）；淡彩或含肤色用{" "}
              <span className="text-neutral-300">HSL Bayer</span>
              {" "}
              （米白不偏粉）；几乎无彩（黑白、线稿）用{" "}
              <span className="text-neutral-300">Redmean</span>
              {" "}
              即可。
            </p>
          </div>

          <div>
            <p className="text-neutral-300 mb-0.5">画面结构</p>
            <p>
              大面积平滑渐变选{" "}
              <span className="text-neutral-300">Atkinson</span>
              {" "}
              抖动（误差扩散让渐变更平滑、色彩更鲜艳）；纯色块、细节文字或想要复古点阵质感选{" "}
              <span className="text-neutral-300">4×4 Bayer</span>
              {" "}
              （纯色干净、边缘锐利）。
            </p>
          </div>

          <div>
            <p className="text-neutral-300 mb-0.5">亮度</p>
            <p>
              16 色地毯整体偏暗（最亮的白地毯也只有 171/255）。画面越亮或越平淡，增强建议越高；
              本来鲜艳或偏暗的图保持 0 即可。
            </p>
          </div>
        </div>

        {/* 专项提示 */}
        <div>
          <p className="text-neutral-300">人物照片</p>
          推荐使用 HSL Bayer + 4×4 Bayer——肤色高光保持白色不偏粉、中间调正确渲染为橙/棕。选择 HSL
          Atkinson 或 HSL Bayer 时会自动切换到搭档抖动。
        </div>
      </div>
    </details>
  );
}
