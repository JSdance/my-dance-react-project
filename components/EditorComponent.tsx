"use client";

import React, { useState, useRef } from 'react';
import axios from 'axios';
import dynamic from 'next/dynamic';

// 【关键点1】静态引入，仅用于获取 TypeScript 类型
// Next.js 编译时会自动处理，只要不把这个 ReactQuill 用在 return 的 JSX 里，就不会报错
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

// 【关键点2】动态引入，用于实际页面渲染 (避免 document not defined)
const ReactQuillDynamic = dynamic(() => import('react-quill-new'), { 
  ssr: false,
  loading: () => <p>编辑器加载中...</p> 
});

// 定义 API 返回的数据接口 (可选，为了更规范)
interface BlockData {
  index: number;
  content: string;
}

interface ApiResponse {
  data: {
    index: number;
    newContent: string;
  }[];
}

export default function EditorComponent() {
  const [value, setValue] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // 【关键点3】这里明确指定泛型为 ReactQuill 类
  // 这样 quillRef.current 就会自动提示 getEditor() 等方法
  const quillRef = useRef<ReactQuill>(null);

  const handleRewrite = async () => {
    // TypeScript 此时知道 current 可能是 null，所以必须做非空检查
    if (!quillRef.current) return;

    // 【关键点4】现在输入 . 之后，IDE 会自动提示 getEditor()！
    // getEditor() 返回的是 Quill 核心实例
    const editor = quillRef.current.getEditor();
    
    // 获取 Delta 数据
    const delta = editor.getContents();
    const ops = delta.ops;

    if (!ops || ops.length === 0) {
      alert('请先粘贴文章');
      return;
    }

    setLoading(true);

    try {
      let textBlocks: BlockData[] = [];
      
      ops.forEach((op, index) => {
        // op 的类型来自 Quill 定义，通常是 any 或特定接口，这里我们可以做简单的断言
        if (typeof op.insert === 'string' && op.insert.trim().length > 5) {
          textBlocks.push({ index, content: op.insert });
        }
      });

      if (textBlocks.length === 0) throw new Error('未检测到有效文本');

      // 发送请求
      const res = await axios.post<ApiResponse>('/api/rewrite', { blocks: textBlocks });
      const newTexts = res.data.data;

      // 拼回数据
      newTexts.forEach((item) => {
        if (ops[item.index]) {
          ops[item.index].insert = item.newContent;
        }
      });

      // 更新编辑器
      editor.setContents(ops, 'api'); 
      
      alert('改写完成！');

    } catch (error) {
      console.error(error);
      alert('改写失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">AI 写实化改写助手 (TS版)</h1>
        <button 
          onClick={handleRewrite}
          disabled={loading}
          className={`px-6 py-2 rounded text-white transition-colors ${
            loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? '处理中...' : '一键改写'}
        </button>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* 【关键点5】这里渲染的是 Dynamic 组件，但 ref 会转发给内部实例 */}
        <ReactQuillDynamic 
          theme="snow" 
          // @ts-ignore (由于 dynamic 包装导致 ref 类型推断偶尔失效，这里忽略是安全的，或者用 forwardRef 包装但太麻烦)
          ref={quillRef}
          value={value} 
          onChange={setValue}
          className="h-[600px]"
        />
      </div>
    </div>
  );
}