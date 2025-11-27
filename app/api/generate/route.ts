import { NextResponse } from 'next/server';
import axios from 'axios';

const apiKey = process.env.SILICONFLOW_API_KEY;
const API_URL = 'https://api.siliconflow.cn/v1/chat/completions';

// 🔵 复用之前的百度图片搜索函数 (保持不变)
async function searchImageOnBaidu(keyword: string) {
  try {
    const baiduUrl = 'https://image.baidu.com/search/acjson';
    const response = await axios.get(baiduUrl, {
      params: {
        tn: 'resultjson_com', logid: Date.now(), ipn: 'rj', ct: 201326592, is: '', fp: 'result',
        queryWord: keyword, cl: 2, lm: -1, ie: 'utf-8', oe: 'utf-8', adpicid: '', st: -1, z: '',
        ic: 0, hd: '', latest: '', copyright: '', word: keyword, s: '', se: '', tab: '',
        width: '', height: '', face: 0, istype: 2, qc: '', nc: 1, fr: '', expermode: '', force: '',
        pn: 0, rn: 1, gsm: '1e',
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://image.baidu.com/',
      },
      timeout: 5000
    });
    return response.data?.data?.[0]?.thumbURL || null;
  } catch (error) {
    return null;
  }
}

// 🟡 新增：根据 topic 判断文章类型
function detectArticleType(topic: string) {
  const t = topic.toLowerCase();
  // 关键词匹配策略
  if (t.includes('推荐') || t.includes('排行') || t.includes('值得买') || t.includes('二手') || t.includes('性价比')) {
    return 'REVIEW'; // 评测/推荐模式
  }
  if (t.includes('怎么') || t.includes('如何') || t.includes('步骤') || t.includes('教程') || t.includes('指南') || t.includes('验机')) {
    return 'TUTORIAL'; // 教程/步骤模式
  }
  return 'GENERAL'; // 默认模式
}

// 🟡 新增：获取不同类型的 System Prompt
function getSystemPrompt(type: string, topic: string) {
  
  // 1. 评测推荐模式 (原有的逻辑)
  if (type === 'REVIEW') {
    return `
     你是一个拥有10年经验的数码/市场行情分析师。
      
      任务：根据用户主题“${topic}”，写一篇深度分析文章。

      【第一步：生成爆款标题（至关重要）】：
      1. **绝对不要**直接使用用户的输入作为标题。
      2. 请根据主题构思一个**极具吸引力、让人忍不住点击**的标题。
      3. **爆款公式** = 情绪/痛点 + 具体数字 + 强烈对比/悬念。
      4. 举例：
         - 用户输"二手手机" -> 标题："预算2000元！这3款二手神机吊打新机，第2款太香了！"
         - 用户输"iPhone15" -> 标题："别乱买！iPhone 15 使用两周后的真实感受，这3个缺点受不了"
         - 用户输"宿舍做饭" -> 标题："宿舍党必看！这5款神器让你实现火锅自由，宿管阿姨都想吃"
      5. **输出格式**：文章的**第一行**必须是这个爆款标题，使用 <h1> 标签包裹，例如：<h1>你的爆款标题</h1>

      【第二步：文章结构要求】：
      1. **开篇**：承接标题情绪，简述行情。
      2. **产品推荐**：推荐 3-4 款产品，使用下方的【产品卡片HTML模板】。
      3. **总结表格**：文章最后必须包含一个 HTML 表格，使用下方的【表格HTML模板】。

      【第三步：产品分析卡片格式（必须严格遵守 HTML 结构）】：
      对于每款产品，请不要只写纯文本，必须按以下 HTML 模板输出（请自己填入具体内容）：

      <div style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin: 20px 0; background-color: #fff;">
        <h3 style="margin-top: 0; color: #1f2937;">第一款：iPhone 13 Pro</h3>
        
        {{IMG_SEARCH:产品名称+实拍图}} 
        
        <div style="display: flex; gap: 10px; margin: 15px 0; flex-wrap: wrap;">
          <span style="background: #eff6ff; color: #2563eb; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: bold;">
            🏆 推荐评分：9.2分
          </span>
          <span style="background: #fef2f2; color: #dc2626; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: bold;">
            💰 二手参考价：2800-3200元
          </span>
        </div>

        <div style="margin-bottom: 15px;">
          <div style="font-size: 14px; color: #6b7280; margin-bottom: 5px;">性价比指数 (Cost Performance)</div>
          <div style="width: 100%; background-color: #f3f4f6; border-radius: 999px; height: 10px;">
            <div style="width: 90%; background-color: #10b981; height: 10px; border-radius: 999px;"></div>
          </div>
          <p style="font-size: 12px; color: #10b981; margin-top: 4px;">击败了 90% 的同价位竞品</p>
        </div>

        <ul style="background: #f9fafb; padding: 15px 15px 15px 35px; border-radius: 8px; font-size: 15px; color: #374151;">
          <li><strong>核心配置：</strong> 处理器/屏幕/电池等简述</li>
          <li><strong>推荐理由：</strong> 为什么买它？（例如：拍照无敌、手感好）</li>
          <li><strong>避坑指南：</strong> 缺点是什么？（例如：续航一般、发热严重）</li>
        </ul>
      </div>

      【注意】：
      1. 遇到具体的 CSS width (如 width: 90%)，请根据你对该产品的性价比判断动态调整数值。
      2. 二手价格请根据当前中国市场行情进行合理估算（例如 2024年行情）。
      3. 图片依然使用 {{IMG_SEARCH:关键词}} 占位符。
      【表格 HTML 模板（请填入数据，不要改变样式）】：
      <h3 style="margin-top: 0; color: #1f2937;">汇总：</h3>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: left; font-weight: bold; color: #111827;">机型名称</td>
            <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: left; font-weight: bold; color: #111827;">处理器</td>
            <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: left; font-weight: bold; color: #111827;">二手参考价</td>
            <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: left; font-weight: bold; color: #111827;">性价比评分</td>
          </tr>
        </thead>
        <tbody>
          <!-- 请根据推荐的产品生成 3-4 行数据 -->
          <tr>
            <td style="border: 1px solid #e5e7eb; padding: 12px; color: #374151;">产品A</td>
            <td style="border: 1px solid #e5e7eb; padding: 12px; color: #374151;">参数A</td>
            <td style="border: 1px solid #e5e7eb; padding: 12px; color: #dc2626; font-weight: bold;">1999元</td>
            <td style="border: 1px solid #e5e7eb; padding: 12px; color: #059669;">9.5分</td>
          </tr>
        </tbody>
      </table>

      【产品卡片格式（保持之前的要求，此处省略，请保留之前的卡片提示词逻辑）】：
      ... (请把之前写过的产品卡片 HTML 模板放在这里) ...
    `;
  }

  // 2. 教程/步骤模式 (新模式：针对“验机”、“拆解”、“怎么做”)
  if (type === 'TUTORIAL') {
    return `
      你是一个资深的动手达人/技术专家，擅长把复杂的事情拆解成简单的步骤。
      任务：教会用户“${topic}”。

      【第一步：生成爆款标题（至关重要）】：
      1. **绝对不要**直接使用用户的输入作为标题。
      2. 请根据主题构思一个**极具吸引力、让人忍不住点击**的标题。
      3. **爆款公式** = 情绪/痛点 + 具体数字 + 强烈对比/悬念。
      4. 举例：
         - 用户输"二手手机" -> 标题："预算2000元！这3款二手神机吊打新机，第2款太香了！"
         - 用户输"iPhone15" -> 标题："别乱买！iPhone 15 使用两周后的真实感受，这3个缺点受不了"
         - 用户输"宿舍做饭" -> 标题："宿舍党必看！这5款神器让你实现火锅自由，宿管阿姨都想吃"
      5. **输出格式**：文章的**第一行**必须是这个爆款标题，使用 <h1> 标签包裹，例如：<h1>你的爆款标题</h1>

      【第二步：格式要求】：
      1. 语气要清晰、指令性强。
      2. **核心结构**：必须按“步骤”进行拆解 (Step-by-Step)。
      3. 每一主要步骤都要配图。

      【第三步：HTML 模板要求】：
      请严格按照以下格式输出每一个步骤（根据实际需要生成 4-6 个步骤）：

      <div style="margin-bottom: 30px; border-left: 4px solid #8b5cf6; padding-left: 20px;">
        <h3 style="color: #4c1d95; margin-bottom: 10px;">步骤 X：[步骤标题]</h3>
        <p style="color: #4b5563; margin-bottom: 10px;">[详细的操作指导，告诉用户具体怎么做，注意什么细节]</p>
        
        {{IMG_SEARCH:${topic} 步骤X [关键词] 实拍}}
        
        <div style="background: #fff7ed; color: #c2410c; padding: 10px; border-radius: 6px; font-size: 14px; margin-top: 10px;">
          ⚠️ 注意事项：[这里写该步骤容易出错的地方]
        </div>
      </div>

      【第四步：结尾】：
      给出一个简单的总结或成功后的效果描述。
    `;
  }

  // 3. 通用/科普模式 (针对普通文章)
  return `
    你是一个知识渊博的科普作家。
    任务：为用户讲解“${topic}”。

    【第一步：生成爆款标题（至关重要）】：
      1. **绝对不要**直接使用用户的输入作为标题。
      2. 请根据主题构思一个**极具吸引力、让人忍不住点击**的标题。
      3. **爆款公式** = 情绪/痛点 + 具体数字 + 强烈对比/悬念。
      4. 举例：
         - 用户输"二手手机" -> 标题："预算2000元！这3款二手神机吊打新机，第2款太香了！"
         - 用户输"iPhone15" -> 标题："别乱买！iPhone 15 使用两周后的真实感受，这3个缺点受不了"
         - 用户输"宿舍做饭" -> 标题："宿舍党必看！这5款神器让你实现火锅自由，宿管阿姨都想吃"
      5. **输出格式**：文章的**第一行**必须是这个爆款标题，使用 <h1> 标签包裹，例如：<h1>你的爆款标题</h1>
    
    【第二部：内容要求】：
    1. 逻辑清晰，分点叙述。
    2. 使用 HTML 格式（h2, p, ul, li）。
    3. 文章中自然插入 3 张左右的相关配图，使用 {{IMG_SEARCH:具体场景关键词}}。
    4. 重点词汇可以加粗。
    5. 风格通俗易懂，像知乎高赞回答。
  `;
}


export async function POST(request: Request) {
  if (!apiKey) {
    return NextResponse.json({ error: 'Key 未配置' }, { status: 500 });
  }

  try {
    const { topic } = await request.json();

    // 1. 🕵️‍♂️ 侦测类型
    const articleType = detectArticleType(topic);
    console.log(`Topic: "${topic}" detected as type: ${articleType}`);

    // 2. 🎨 获取对应的 Prompt
    const systemPrompt = getSystemPrompt(articleType, topic);

    // 3. 发送请求
    const response = await axios.post(API_URL, {
      model: "Qwen/Qwen2.5-7B-Instruct",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `开始撰写关于“${topic}”的文章。` }
      ],
      temperature: 0.7, 
      max_tokens: 4096
    }, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });

    let content = response.data.choices[0].message.content;

    // 4. 🖼️ 处理图片搜索 (通用逻辑)
    const regex = /{{IMG_SEARCH:(.*?)}}/g;
    const matches = [...content.matchAll(regex)];

    if (matches.length > 0) {
      const replaceTasks = matches.map(async (match) => {
        const placeholder = match[0];
        const keyword = match[1];
        const imageUrl = await searchImageOnBaidu(keyword);
        
        // 根据不同文章类型，图片样式也可以微调（这里暂且统一）
        return {
          placeholder,
          replacement: imageUrl 
            ? `<img src="${imageUrl}" alt="${keyword}" style="border-radius: 8px; margin: 15px 0; width: 100%; max-height: 400px; object-fit: cover; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);" />` 
            : '' 
        };
      });

      const results = await Promise.all(replaceTasks);
      results.forEach(({ placeholder, replacement }) => {
        content = content.replace(placeholder, replacement);
      });
    }

    return NextResponse.json({ content, type: articleType }); // 可以把类型也返回给前端做展示

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}