"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import axios from 'axios';

// 定义支持的平台配置
const PLATFORMS = [
  { id: 'xhs', name: '小红书', icon: '📕', color: 'bg-red-50 text-red-600 border-red-200' },
  { id: 'douyin', name: '抖音脚本', icon: '🎬', color: 'bg-slate-50 text-slate-800 border-slate-200' },
  { id: 'wechat', name: '公众号', icon: '🟢', color: 'bg-green-50 text-green-600 border-green-200' },
  { id: 'linkedin', name: '职场/领英', icon: '💼', color: 'bg-blue-50 text-blue-600 border-blue-200' },
];

export default function MatrixPage() {
  const [topic, setTopic] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['xhs', 'douyin']);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState(''); // 当前查看的平台结果

  // 切换平台选择
  const togglePlatform = (id: string) => {
    if (selectedPlatforms.includes(id)) {
      setSelectedPlatforms(prev => prev.filter(p => p !== id));
    } else {
      setSelectedPlatforms(prev => [...prev, id]);
    }
  };

  const handleGenerate = async () => {
    if (!topic.trim()) return alert('请输入主题');
    if (selectedPlatforms.length === 0) return alert('请至少选择一个平台');

    setLoading(true);
    setResults({}); // 清空旧结果
    
    try {
      const res = await axios.post('/api/matrix', { 
        topic, 
        platforms: selectedPlatforms 
      });
      
      setResults(res.data.results);
      // 默认选中第一个有结果的平台
      setActiveTab(selectedPlatforms[0]);
      
    } catch (error) {
      console.error(error);
      alert('生成失败');
    } finally {
      setLoading(false);
    }
  };

  // 复制功能
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('已复制到剪贴板');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* 顶部 */}
        <div className="mb-8 flex items-center justify-between">
           <Link href="/" className="text-gray-500 hover:text-blue-600 flex items-center gap-1">
            ← 返回首页
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">🚀 社交媒体矩阵一键生成</h1>
        </div>

        {/* 输入 & 选择区域 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
          
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-3">1. 选择目标平台 (多选)</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {PLATFORMS.map((p) => {
                const isSelected = selectedPlatforms.includes(p.id);
                return (
                  <div 
                    key={p.id}
                    onClick={() => togglePlatform(p.id)}
                    className={`
                      cursor-pointer p-4 rounded-xl border-2 transition-all flex items-center gap-3
                      ${isSelected 
                        ? `${p.color} border-current ring-1 ring-offset-1` 
                        : 'bg-white border-gray-100 hover:border-gray-300 text-gray-500 grayscale'
                      }
                    `}
                  >
                    <span className="text-2xl">{p.icon}</span>
                    <span className="font-bold">{p.name}</span>
                    {isSelected && <span className="ml-auto text-xs">✓</span>}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">2. 输入核心主题</label>
            <div className="flex gap-4">
              <input 
                type="text" 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="例如：iPhone 15 值得买吗？ / 如何在家做低脂餐..."
                className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              />
              <button 
                onClick={handleGenerate}
                disabled={loading}
                className={`
                  px-8 py-3 rounded-lg font-bold text-white transition-all shadow-lg
                  ${loading 
                    ? 'bg-blue-300 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 hover:shadow-xl'
                  }
                `}
              >
                {loading ? '矩阵分发中...' : '一键生成'}
              </button>
            </div>
          </div>
        </div>

        {/* 结果展示区 (Tabs 切换) */}
        {Object.keys(results).length > 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden animate-fade-in-up">
            {/* Tabs 头部 */}
            <div className="flex border-b border-gray-200 bg-gray-50 overflow-x-auto">
              {selectedPlatforms.map((pid) => {
                const platform = PLATFORMS.find(p => p.id === pid);
                if (!results[pid]) return null;
                
                const isActive = activeTab === pid;
                return (
                  <button
                    key={pid}
                    onClick={() => setActiveTab(pid)}
                    className={`
                      px-6 py-4 font-medium text-sm whitespace-nowrap transition-all flex items-center gap-2
                      ${isActive 
                        ? 'bg-white text-blue-600 border-t-2 border-blue-600' 
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    <span>{platform?.icon}</span>
                    {platform?.name}
                  </button>
                );
              })}
            </div>

            {/* 内容区域 */}
            <div className="p-6 min-h-[400px]">
              <div className="flex justify-between items-center mb-4">
                 <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">Generated Content</span>
                 <button 
                   onClick={() => copyToClipboard(results[activeTab])}
                   className="text-sm bg-gray-100 hover:bg-blue-50 text-gray-600 hover:text-blue-600 px-3 py-1 rounded border border-gray-200 transition-colors"
                 >
                   📋 复制文案
                 </button>
              </div>
              
              <div className="prose max-w-none bg-gray-50 p-6 rounded-lg border border-gray-100">
                {/* 这里使用 whitespace-pre-wrap 保留换行符 */}
                <div className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed">
                  {results[activeTab]}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}