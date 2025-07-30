import { useState } from 'react';
import { parseDocument } from '../src/utils/documentParser';

export default function DebugPDF() {
  const [status, setStatus] = useState<string>('');
  const [result, setResult] = useState<any>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setStatus(`开始解析文件: ${file.name} (${file.type}, ${(file.size / 1024 / 1024).toFixed(2)}MB)`);
    setResult(null);

    try {
      console.log('开始PDF解析测试:', file);
      const parseResult = await parseDocument(file);
      console.log('解析完成:', parseResult);
      
      setResult(parseResult);
      if (parseResult.success) {
        setStatus(`✅ 解析成功! 提取了 ${parseResult.content?.length || 0} 个字符`);
      } else {
        setStatus(`❌ 解析失败: ${parseResult.error}`);
      }
    } catch (error) {
      console.error('解析错误:', error);
      setStatus(`💥 异常错误: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>PDF解析调试工具</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileUpload}
          style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
        />
      </div>

      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
        <strong>状态:</strong> {status || '请选择一个PDF文件进行测试'}
      </div>

      {result && (
        <div style={{ marginBottom: '20px' }}>
          <h3>解析结果:</h3>
          <pre style={{ 
            backgroundColor: '#f0f0f0', 
            padding: '10px', 
            borderRadius: '4px', 
            overflow: 'auto',
            maxHeight: '300px',
            fontSize: '12px'
          }}>
            {JSON.stringify(result, null, 2)}
          </pre>
          
          {result.success && result.content && (
            <div style={{ marginTop: '20px' }}>
              <h4>提取的文本内容 (前500字符):</h4>
              <div style={{ 
                backgroundColor: '#fff', 
                border: '1px solid #ddd', 
                padding: '10px', 
                borderRadius: '4px',
                maxHeight: '200px',
                overflow: 'auto'
              }}>
                {result.content.substring(0, 500)}
                {result.content.length > 500 && '...'}
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: '30px', padding: '10px', backgroundColor: '#e8f4fd', borderRadius: '4px' }}>
        <h4>调试步骤:</h4>
        <ol>
          <li>打开浏览器开发者工具 (F12)</li>
          <li>切换到 Console 标签</li>
          <li>选择一个PDF文件上传</li>
          <li>观察控制台的详细日志输出</li>
          <li>如果失败，查看具体的错误信息</li>
        </ol>
      </div>
    </div>
  );
} 