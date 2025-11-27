import EditorComponent from '../../components/EditorComponent';
import Link from 'next/link';

export default function RewritePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4">
        <Link href="/" className="text-gray-500 hover:text-blue-600 flex items-center gap-1 mb-4">
          ← 返回首页
        </Link>
      </div>
      {/* 复用你之前的组件 */}
      <EditorComponent />
    </div>
  );
}