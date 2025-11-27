import Link from 'next/link';

export default function Home() {
  // 定义功能卡片数据，方便统一管理样式
  const features = [
    {
      title: "文章改写 / 润色",
      // 使用 JSX 元素以保留 <b> 标签的样式
      description: (
        <>
          粘贴已有图文，AI 帮你去除浮夸营销味，一键转换为<b className="text-gray-700">写实、客观</b>风格，完美保留原排版。
        </>
      ),
      path: "/rewrite",
      icon: "📝",
      theme: "blue" // 蓝色主题：代表专业、冷静
    },
    {
      title: "一键生成带图文章",
      description: (
        <>
          输入标题（如"二手手机推荐"），AI 自动撰写深度评测，自动<b className="text-gray-700">百度配图</b>、生成价格分析卡片。
        </>
      ),
      path: "/generate",
      icon: "✨",
      theme: "purple" // 紫色主题：代表魔法、生成
    },
    {
      title: "社媒矩阵一键生成",
      description: (
        <>
          输入一个主题，同时生成<b className="text-gray-700">小红书爆款</b>、抖音分镜脚本、公众号深度文章，多平台分发。
        </>
      ),
      path: "/matrix",
      icon: "🔥", // 火焰图标代表热度
      theme: "red" // 红色主题：代表热门、社交
    }
  ];

  // 辅助函数：根据 theme 返回对应的颜色样式类
  const getThemeStyles = (theme: string) => {
    switch (theme) {
      case 'blue':
        return {
          iconBg: 'bg-blue-50 text-blue-600',
          hoverTitle: 'group-hover:text-blue-600',
          border: 'hover:border-blue-200'
        };
      case 'purple':
        return {
          iconBg: 'bg-purple-50 text-purple-600',
          hoverTitle: 'group-hover:text-purple-600',
          border: 'hover:border-purple-200'
        };
      case 'red':
        return {
          iconBg: 'bg-red-50 text-red-600',
          hoverTitle: 'group-hover:text-red-600',
          border: 'hover:border-red-200'
        };
      default:
        return {
          iconBg: 'bg-gray-100 text-gray-600',
          hoverTitle: 'group-hover:text-gray-900',
          border: 'hover:border-gray-200'
        };
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col items-center justify-center p-6">
      
      {/* 顶部标题区 */}
      <div className="text-center mb-16 space-y-4">
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-900">
          AI 自媒体创作工坊
        </h1>
        <p className="text-xl text-gray-500 font-medium">
          写实风格 · 自动配图 · 矩阵分发
        </p>
      </div>

      {/* 核心功能卡片区 - 改为 3 列布局 */}
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl w-full">
        {features.map((feature) => {
          const styles = getThemeStyles(feature.theme);
          
          return (
            <Link key={feature.path} href={feature.path} className="group block h-full">
              <div className={`
                bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl 
                transition-all duration-300 transform hover:-translate-y-2 
                border border-gray-100 h-full flex flex-col
                ${styles.border}
              `}>
                {/* 图标 */}
                <div className={`
                  h-16 w-16 rounded-2xl flex items-center justify-center mb-6 text-3xl shadow-sm
                  ${styles.iconBg}
                `}>
                  {feature.icon}
                </div>

                {/* 标题 */}
                <h2 className={`
                  text-2xl font-bold text-gray-800 mb-4 transition-colors
                  ${styles.hoverTitle}
                `}>
                  {feature.title}
                </h2>

                {/* 描述 */}
                <p className="text-gray-500 leading-relaxed flex-1">
                  {feature.description}
                </p>

                {/* 底部箭头（增加交互感） */}
                <div className="mt-6 flex items-center text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-gray-400">
                  立即开始 <span className="ml-1">→</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* 底部版权 */}
      <div className="mt-20 text-gray-400 text-sm">
        © 2024 AI Content Workshop. All rights reserved.
      </div>
    </main>
  );
}