import Link from "next/link";

/**
 * 免责声明（基础模板）：各章节按实际情况增删、修改即可。
 */
export default function Disclaimer() {
  return (
    <div className="flex-1 max-w-4xl mx-auto px-6">
      <div className="w-full py-12 space-y-8 noto-sans">
        <Link href="/" className="flex items-center gap-2 text-sm opacity-80 hover:opacity-100 duration-150 ease-in-out mb-8">
          <p className="mc-arrow rotate-180" />
          <p>
            返回主页
          </p>
        </Link>

        <h1 className="text-4xl noto-sans text-neutral-200">免责声明</h1>

        <p className="text-sm text-neutral-400 leading-relaxed">
          欢迎使用 Penelope。在使用本站提供的任何服务之前，请仔细阅读以下免责声明。
        </p>

        <section className="space-y-2">
          <h2 className="text-lg text-neutral-200 font-semibold">一、项目性质</h2>
          <p className="text-sm text-neutral-400 leading-relaxed">
            Penelope 是由社区爱好者开发的开源项目，与 Mojang Studios、Microsoft
            Corporation 及其关联公司（以下简称“Mojang / Microsoft”）不存在任何隶属、合作或授权关系。
            本站提供的所有工具与服务均出于学习与娱乐目的。
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg text-neutral-200 font-semibold">二、知识产权</h2>
          <p className="text-sm text-neutral-400 leading-relaxed">
            游戏《我的世界》（Minecraft）及其相关的名称、商标、美术素材等知识产权均归
            Mojang / Microsoft 所有。本项目中出现的方块材质等素材仅用于功能展示，版权归原作者所有，
            本站不主张对上述素材的任何所有权。
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg text-neutral-200 font-semibold">三、用户内容</h2>
          <p className="text-sm text-neutral-400 leading-relaxed">
            您上传的图片内容由您全权负责。您应保证上传的图片不侵犯任何第三方的版权、商标权、肖像权、
            隐私权等合法权益，也不包含违法违规或不当内容。因您上传的内容引发的任何纠纷或损失，
            由您自行承担，与本站无关。
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg text-neutral-200 font-semibold">四、数据处理与隐私</h2>
          <p className="text-sm text-neutral-400 leading-relaxed">
            本站的图片处理完全在您的浏览器本地通过 WebAssembly 完成，图片不会被上传到任何服务器，
            我们也不会收集、存储或分析您的图片内容。图片仅在当前设备的浏览器内存中短暂存在，
            关闭页面后即被清除。
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg text-neutral-200 font-semibold">五、结果与使用风险</h2>
          <p className="text-sm text-neutral-400 leading-relaxed">
            地图画的生成效果受算法、抖动方式、增强参数、方块选择及原图质量等多种因素影响，
            本站不对生成结果的最终视觉效果作任何保证。您将生成的地图画、投影文件等用于任何用途时，
            请自行判断其合理性与合法性，并自行承担相应风险。
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg text-neutral-200 font-semibold">六、服务变更</h2>
          <p className="text-sm text-neutral-400 leading-relaxed">
            本站可能随时更新、调整功能，或暂停、终止服务，恕不另行通知。因服务中断、功能调整或
            使用本站导致的任何损失，本站概不负责。
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg text-neutral-200 font-semibold">七、服务器与备案</h2>
          <p className="text-sm text-neutral-400 leading-relaxed">
            本站的服务器与域名均不在中国境内注册，因此无需进行 ICP 备案，也不受中国大陆服务器相关监管要求约束。
            请根据您所在地区适用的法律法规自行判断本站的访问与使用。
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg text-neutral-200 font-semibold">八、第三方链接</h2>
          <p className="text-sm text-neutral-400 leading-relaxed">
            本站可能包含指向第三方网站或资源的链接，这些第三方网站的内容与本站无关，
            本站不对其可用性、准确性或合法性负责。
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg text-neutral-200 font-semibold">九、条款接受</h2>
          <p className="text-sm text-neutral-400 leading-relaxed">
            当您开始使用本站时，即视为您已阅读、理解并同意本免责声明的全部内容。
            如果您不同意本声明的任何条款，请立即停止使用本站。
          </p>
        </section>
      </div>
    </div>
  )
}
