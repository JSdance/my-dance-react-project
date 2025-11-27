"use client";

import React, { useState, useRef } from 'react';
import axios from 'axios';
import dynamic from 'next/dynamic';

// 1. 解决样式不加载：确保这行引用存在
import 'react-quill-new/dist/quill.snow.css';

// 2. 解决 "document is not defined"：关闭 SSR
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false }) as any;

export default function EditorComponent() {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  
  // 3. 解决 TypeScript Ref 报错：这里定义为 any
  const quillRef = useRef<any>(null);

  const handleRewrite = async () => {
    // 校验编辑器实例是否存在
    if (!quillRef.current) return;

    // 获取编辑器核心对象
    // 注意：如果这里报错 .getEditor is not a function，说明 ref 绑定没生效
    const editor = quillRef.current.getEditor();
    
    const delta = editor.getContents();
    const ops = delta.ops;

    if (!ops || ops.length === 0) return alert('请先粘贴文章');

    setLoading(true);

    try {
      let textBlocks: any[] = [];
      
      ops.forEach((op: any, index: number) => {
        if (typeof op.insert === 'string' && op.insert.trim() !== '') {
          textBlocks.push({ index, content: op.insert });
        }
      });

      if (textBlocks.length === 0) {
        alert('未检测到有效文字');
        setLoading(false);
        return;
      }

      // 发送请求
      const res = await axios.post('/api/rewrite', { blocks: textBlocks });
      const newTexts = res.data.data;

      // 拼装回编辑器
      newTexts.forEach((item: any) => {
        if (ops[item.index]) {
          ops[item.index].insert = item.newContent;
        }
      });

      // 更新内容，保持用户选区模式
      editor.setContents(ops, 'user');
      alert('✅ 改写完成！');

    } catch (error) {
      console.error(error);
      alert('❌ 改写失败，请检查控制台');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">文章改写助手</h1>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <ReactQuill 
          theme="snow" 
          
          // 3. 【核心修改】解决 TypeScript Ref 报错的终极方案：
          // 不要直接写 ref={quillRef}
          // 而是用回调函数，强制把 el 赋值给 current，TS 就不会纠结类型了
          ref={(el: any) => {
            quillRef.current = el;
          }}
          
          value={value} 
          onChange={setValue}
          placeholder="请直接 Ctrl+V 粘贴带图的文章..."
          className="h-[600px]"
          modules={{
            toolbar: [
              [{ 'header': [1, 2, false] }],
              ['bold', 'italic', 'underline', 'strike', 'blockquote'],
              [{'list': 'ordered'}, {'list': 'bullet'}],
              ['link', 'image'],
              ['clean']
            ],
          }}
        />
      </div>
      
      <div className="mt-6 text-right">
         <button 
          onClick={handleRewrite}
          disabled={loading}
          className={`
            px-6 py-3 rounded-lg font-medium text-white text-lg
            ${loading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg'
            }
          `}
        >
          {loading ? 'AI 正在思考中...' : '✨ 开始改写'}
        </button>
      </div>
    </div>
  );
}