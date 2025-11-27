import { NextResponse } from 'next/server';
import axios from 'axios';

// 1. 这里的 Key 一定要确保在 .env.local 里配好了
const apiKey = process.env.SILICONFLOW_API_KEY;
const API_URL = 'https://api.siliconflow.cn/v1/chat/completions';

export async function POST(request: Request) {
  // 检查 Key
  if (!apiKey) {
    console.error("❌ 错误：未找到 API Key");
    return NextResponse.json({ error: '服务端未配置 Key' }, { status: 500 });
  }

  try {
    const { blocks } = await request.json();
    
    console.log(`👉 收到 ${blocks.length} 个段落，开始请求 AI...`);

    const tasks = blocks.map(async (block: any) => {
      try {
        const response = await axios.post(API_URL, {
          model: "Qwen/Qwen2.5-7B-Instruct", 
          messages: [
            {
              role: "system",
              content: "请将这段话改写得更加客观、写实、简练。去除浮夸修辞。直接输出结果，不要重复原文。"
            },
            { role: "user", content: block.content }
          ],
          temperature: 0.3,
          max_tokens: 2048
        }, {
          headers: { 
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json' 
          },
          timeout: 60000 // 60秒超时
        });

        const newText = response.data.choices[0].message.content;
        return { index: block.index, newContent: newText };

      } catch (error: any) {
        // === 🚨 核心修改在这里 🚨 ===
        // 以前是返回 block.content (原文)，现在我们让它显示错误！
        console.error(`❌ 段落 ${block.index} 失败:`, error.message);
        
        let errorMsg = "AI请求失败";
        
        if (error.response) {
          // 获取详细的错误原因
          const status = error.response.status;
          const data = error.response.data;
          
          if (status === 401) errorMsg = "【错误401: API Key 无效】";
          else if (status === 402) errorMsg = "【错误402: 余额不足/欠费】";
          else if (status === 429) errorMsg = "【错误429: 请求太快/超额】";
          else errorMsg = `【错误${status}: ${JSON.stringify(data)}】`;
        } else {
          errorMsg = `【网络/连接错误: ${error.message}】`;
        }

        // 把错误信息加粗显示在文章里
        return { 
            index: block.index, 
            newContent: `🛑 ${errorMsg} (原文: ${block.content})` 
        };
      }
    });

    const results = await Promise.all(tasks);
    return NextResponse.json({ data: results });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}