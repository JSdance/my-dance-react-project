"use client";

import React, { useState, useRef } from 'react';
import axios from 'axios';
// 1. 引入 next/dynamic 用于动态加载
import dynamic from 'next/dynamic';

// 2. 动态引入 react-quill-new，并关闭 SSR (服务端渲染)
// 因为编辑器依赖 window 对象，必须要在客户端加载
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

// 3. 引入样式文件 (注意路径也是 react-quill-new)
import 'react-quill-new/dist/quill.snow.css';

export default function EditorComponent() {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  // 使用 useRef 获取编辑器实例
  const quillRef = useRef<any>(null);

  const handleRewrite = async () => {
    if (!quillRef.current) return;
    
    // 获取原生的 Quill 实例
    const editor = quillRef.current.getEditor();
    
    // === 核心逻辑开始 (与之前完全一致) ===
    
    // 获取 Delta 内容 (包含图片对象和文本对象的数组)
    const delta = editor.getContents();
    const ops = delta.ops;

    if (!ops || ops.length === 0) return alert('请先粘贴文章');

    setLoading(true);

    try {
      // 提取文本块
      let textBlocks: any[] = [];
      
      ops.forEach((op: any, index: number) => {
        // 筛选逻辑：是字符串 && 不是纯换行 && 长度大于5
        if (typeof op.insert === 'string' && op.insert.trim().length > 5) {
          textBlocks.push({ index, content: op.insert });
        }
      });

      if (textBlocks.length === 0) throw new Error('未检测到有效文本');

      console.log('发送给AI的段落数:', textBlocks.length);

      // 调用我们的 Next.js API
      const res = await axios.post('/api/rewrite', { blocks: textBlocks });
      const newTexts = res.data.data;

      // 将 AI 返回的新文本拼回 ops 数组
      newTexts.forEach((item: any) => {
        // 替换对应位置的 insert 内容
        ops[item.index].insert = item.newContent;
      });

      // 将修改后的内容重新设置回编辑器
      // 使用 'api' source 防止触发多余的 onChange 事件
      editor.setContents(ops, 'api'); 
      
      alert('改写完成！图片已保留，文字已写实化。');

    } catch (error) {
      console.error(error);
      alert('改写失败，请检查控制台或网络');
    } finally {
      setLoading(false);
    }
    // === 核心逻辑结束 ===
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">AI 写实化改写助手</h1>
          <p className="text-gray-500 text-sm mt-1">基于 react-quill-new 构建</p>
        </div>
        
        <button 
          onClick={handleRewrite}
          disabled={loading}
          className={`
            px-6 py-2.5 rounded-lg font-medium transition-all
            ${loading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
            }
          `}
        >
          {loading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              AI 思考中...
            </span>
          ) : '✨ 一键改写'}
        </button>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <ReactQuill 
          theme="snow" 
          ref={quillRef}
          value={value} 
          onChange={setValue}
          placeholder="请在这里 Ctrl+V 粘贴带图的文章..."
          // 自定义高度样式
          className="h-[600px]"
          // modules 用于配置工具栏，这里保留默认即可，图片粘贴功能是开箱即用的
        />
      </div>
      
      <div className="mt-4 text-center text-gray-400 text-xs">
        Powered by Next.js & DeepSeek API
      </div>
    </div>
  );
}