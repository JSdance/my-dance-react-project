"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import axios from "axios";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

// 引入编辑器
// @ts-expect-error: ignore dynamic import type
const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
}) as any;

export default function GeneratePage() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");

  const handleGenerate = async () => {
    if (!topic.trim()) return alert("请输入文章主题");

    setLoading(true);
    setGeneratedContent("");

    try {
      const res = await axios.post("/api/generate", { topic });
      setGeneratedContent(res.data.content);
    } catch (error) {
      console.error(error);
      alert("生成失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* 🟢 必须添加：防止百度图片裂图 */}
      <meta name="referrer" content="no-referrer" />

      <div className="max-w-4xl mx-auto">
        {/* ... 顶部导航和输入框保持不变 ... */}
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/"
            className="text-gray-500 hover:text-purple-600 flex items-center gap-1"
          >
            ← 返回首页
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">
            ✨ AI 智能图文生成
          </h1>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            你想写什么？
          </label>
          <div className="flex gap-4">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="输入文章主题..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none"
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            />
            <button
              onClick={handleGenerate}
              disabled={loading}
              className={`px-8 py-3 rounded-lg font-bold text-white ${
                loading ? "bg-purple-300" : "bg-purple-600 hover:bg-purple-700"
              }`}
            >
              {loading ? "AI 创作中..." : "立即生成"}
            </button>
          </div>
        </div>

        {/* 结果展示区域 */}
        {generatedContent && (
          <div className="bg-white rounded-xl shadow-lg border border-purple-100 overflow-hidden animate-fade-in-up flex flex-col">
            <div className="p-4 bg-purple-50 border-b border-purple-100 flex justify-between items-center">
              <span className="font-medium text-purple-800">生成结果预览</span>
            </div>

            {/* 
                🟢 修复核心：
                1. 外层 div 设为相对定位或固定高度
                2. 注入一段全局 Style 强制重写 Quill 的默认样式
            */}
            <div className="h-[800px] bg-white flex flex-col relative">
              <ReactQuill
                theme="snow"
                value={generatedContent}
                onChange={setGeneratedContent}
                className="h-full flex flex-col" // 让 Quill 组件本身撑满父容器，并使用 Flex 布局
                modules={{
                  toolbar: [
                    [{ header: [1, 2, false] }],
                    ["bold", "italic", "blockquote"],
                    [{ list: "ordered" }, { list: "bullet" }],
                    ["link", "image"],
                  ],
                }}
              />

              {/* 
                  🎨 CSS 魔法：
                  .quill: 设为 flex 布局，高度 100%
                  .ql-container: 设为 flex: 1 (自动填充剩余高度)，并开启 overflow-y: auto (内部滚动)
              */}

              <style jsx global>{`
                /* 1. 编辑器布局修复（之前解决滚动条问题的代码） */
                .quill {
                  display: flex;
                  flex-direction: column;
                  height: 100%;
                }
                .ql-toolbar {
                  border-top: none !important;
                  flex-shrink: 0;
                  background: #f9fafb;
                  border-bottom: 1px solid #e5e7eb !important;
                }
                .ql-container {
                  flex: 1;
                  overflow-y: auto !important;
                  font-size: 16px;
                  border-bottom: none !important;
                  background: #ffffff;
                }

                /* 2. 🟢 表格样式强制美化 (Table Styling) */
                /* 即使 AI 忘记加 style，这层 CSS 也会生效 */
                .ql-editor table {
                  width: 100% !important;
                  border-collapse: collapse !important;
                  margin: 20px 0 !important;
                }

                .ql-editor th {
                  background-color: #f3f4f6 !important;
                  border: 1px solid #e5e7eb !important;
                  padding: 12px !important;
                  text-align: left !important;
                  font-weight: 600 !important;
                  color: #111827 !important;
                }

                .ql-editor td {
                  border: 1px solid #e5e7eb !important;
                  padding: 12px !important;
                  color: #374151 !important;
                }

                /* 3. 滚动条美化 */
                .ql-container::-webkit-scrollbar {
                  width: 8px;
                }
                .ql-container::-webkit-scrollbar-thumb {
                  background-color: #d1d5db;
                  border-radius: 4px;
                }
                .ql-container::-webkit-scrollbar-track {
                  background-color: transparent;
                }

                /* 4. 图片最大宽度限制，防止撑爆屏幕 */
                .ql-editor img {
                  max-width: 100%;
                  height: auto;
                  display: block;
                  margin: 10px auto;
                }
              `}</style>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
