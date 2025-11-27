import { NextResponse } from 'next/server';
import axios from 'axios';

const apiKey = process.env.SILICONFLOW_API_KEY;
const API_URL = 'https://api.siliconflow.cn/v1/chat/completions';

// 定义不同平台的 "人设" 和 "写作模版"
const PLATFORM_PROMPTS: Record<string, string> = {
  xhs: `
    你是一个小红书爆款文案创作者。
    风格要求：
    1. 标题要极其吸引眼球（使用震惊体、干货体），包含 emoji。
    2. 正文大量使用 Emoji 表情（🌟✨💡🔥）。
    3. 语气要亲切、活泼，像闺蜜聊天（使用"集美们"、"绝绝子"、"亲测"）。
    4. 采用分段式排版，每段很短。
    5. 文末必须生成 10 个相关的热门 Hashtag 标签。
    6. 输出格式：【标题】\n\n【正文】...
  `,
  douyin: `
    你是一个专业的短视频编剧/导演。
    风格要求：
    1. 输出标准的短视频脚本格式。
    2. 包含三个部分：【景别/画面】、【时长】、【口播台词】。
    3. 开头必须是“黄金3秒”钩子，一句话抓住用户注意力。
    4. 结尾要有引导关注/点赞的话术。
    5. 整体时长控制在 45-60 秒口播量。
  `,
  wechat: `
    你是一个深度思考的公众号主编。
    风格要求：
    1. 标题要有深度或引发共鸣。
    2. 逻辑严密，观点独到，文笔流畅。
    3. 适合阅读的 HTML 格式排版（使用 <h3> 小标题）。
    4. 内容要有干货，提供情绪价值或实用价值。
    5. 语气稳重、专业。
  `,
  linkedin: `
    你是一个职场精英/LinkedIn 意见领袖。
    风格要求：
    1. 极简主义，观点犀利。
    2. 适合职场人看的专业建议。
    3. 使用列表（Listicle）形式展示观点。
    4. 语气专业、自信、鼓舞人心。
  `
};

export async function POST(request: Request) {
  if (!apiKey) return NextResponse.json({ error: 'Key 未配置' }, { status: 500 });

  try {
    const { topic, platforms } = await request.json(); // platforms 是一个数组，例如 ['xhs', 'douyin']

    if (!platforms || platforms.length === 0) {
      return NextResponse.json({ error: '请至少选择一个平台' }, { status: 400 });
    }

    // 并发执行所有平台的生成任务
    const tasks = platforms.map(async (platformKey: string) => {
      const systemPrompt = PLATFORM_PROMPTS[platformKey];
      if (!systemPrompt) return null;

      try {
        const response = await axios.post(API_URL, {
          model: "Qwen/Qwen2.5-7B-Instruct",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `主题：${topic}` }
          ],
          temperature: 0.8, // 矩阵生成稍微高一点创造力
          max_tokens: 2048
        }, {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });

        return {
          platform: platformKey,
          content: response.data.choices[0].message.content
        };
      } catch (error) {
        console.error(`Error generating for ${platformKey}:`, error);
        return { platform: platformKey, content: "生成失败，请重试。" };
      }
    });

    // 等待所有任务完成
    const resultsArray = await Promise.all(tasks);
    
    // 转换数组为对象格式 { xhs: "...", douyin: "..." }
    const resultsMap: Record<string, string> = {};
    resultsArray.forEach(item => {
      if (item) resultsMap[item.platform] = item.content;
    });

    return NextResponse.json({ results: resultsMap });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}