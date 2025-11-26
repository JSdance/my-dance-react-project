// app/api/rewrite/route.ts
import { NextResponse } from 'next/server';
import axios from 'axios';

const API_KEY = process.env.DEEPSEEK_API_KEY; // 后面会在 Vercel 设置环境变量
const API_URL = 'https://api.deepseek.com/chat/completions';

export async function POST(request: Request) {
  try {
    const { blocks } = await request.json();

    // 并发请求 AI (逻辑和小程序云函数一样)
    const tasks = blocks.map(async (block: any) => {
      try {
        const response = await axios.post(API_URL, {
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content: "你是一个专业的文章编辑。请将用户输入的这段文字改写为【真实、客观、写实】的风格。去除浮夸的修辞、情感渲染和营销话术，只保留事实描述。语言要简练、平实。直接输出改写后的结果，不要加任何解释。"
            },
            { role: "user", content: block.content }
          ]
        }, {
          headers: { 'Authorization': `Bearer ${API_KEY}` }
        });

        return {
          index: block.index,
          newContent: response.data.choices[0].message.content
        };
      } catch (error) {
        console.error("单段失败", error);
        return { index: block.index, newContent: block.content }; // 失败则返回原文
      }
    });

    const results = await Promise.all(tasks);
    return NextResponse.json({ data: results });

  } catch (error) {
    return NextResponse.json({ error: '处理失败' }, { status: 500 });
  }
}