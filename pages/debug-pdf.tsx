import { useState } from 'react';
import { parseDocument } from '../src/utils/documentParser';

export default function DebugPDF() {
  const [status, setStatus] = useState<string>('');
  const [result, setResult] = useState<any>(null);
  const [progress, setProgress] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setStatus(`开始解析文件: ${file.name} (${file.type}, ${(file.size / 1024 / 1024).toFixed(2)}MB)`);
    setResult(null);
    setProgress(0);
    setIsProcessing(true);
    setDebugLogs([]);

    const startTime = Date.now();

    try {
      console.log('开始PDF解析测试:', file);
      
      // 定义进度回调函数
      const progressCallback = (currentProgress: number, statusMessage: string) => {
        setProgress(Math.round(currentProgress));
        setStatus(`${statusMessage} (${Math.round(currentProgress)}%)`);
        console.log(`进度: ${currentProgress}% - ${statusMessage}`);
      };
      
      const parseResult = await parseDocument(file, undefined, progressCallback);
      const endTime = Date.now();
      const processingTime = ((endTime - startTime) / 1000).toFixed(2);
      
      console.log('解析完成:', parseResult);
      
      // 如果是大文档，尝试检测章节结构进行额外分析
      if (parseResult.success && parseResult.content && parseResult.content.length > 30000) {
        console.log('检测到超大文档，分析章节结构...');
        
        // 简单的章节检测测试
        const chapterPatterns = [
          /^第[一二三四五六七八九十\d]+章\s+[^\n]+/gm,
          /^Chapter\s+\d+[:\s•\-—]+[^\n]+/gmi,
          /^\d+[\.、]\s+[^\n]{5,100}$/gm,
        ];
        
        for (const pattern of chapterPatterns) {
          const matches = Array.from(parseResult.content.matchAll(pattern));
          if (matches.length > 0) {
            console.log(`检测到${matches.length}个章节 (模式: ${pattern.source}):`);
            matches.slice(0, 10).forEach((match, index) => {
              console.log(`  ${index + 1}. ${match[0].trim()}`);
            });
            if (matches.length > 10) {
              console.log(`  ... 还有${matches.length - 10}个章节`);
            }
            break;
          }
        }
      }
      
      setResult(parseResult);
      setIsProcessing(false);
      
      if (parseResult.success) {
        const wordCount = parseResult.content?.split(/\s+/).length || 0;
        const charCount = parseResult.content?.length || 0;
        setStatus(`✅ 解析成功! 耗时 ${processingTime}s | 提取了 ${charCount} 个字符 (约 ${wordCount} 个词)`);
        setProgress(100);
      } else {
        setStatus(`❌ 解析失败: ${parseResult.error}`);
        setProgress(0);
      }
    } catch (error) {
      console.error('解析错误:', error);
      setStatus(`💥 异常错误: ${error instanceof Error ? error.message : '未知错误'}`);
      setIsProcessing(false);
      setProgress(0);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>PDF解析调试工具 (优化版)</h1>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        支持大文件分批处理，实时进度显示，增强错误处理
      </p>
      
      <div style={{ marginBottom: '20px' }}>
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileUpload}
          disabled={isProcessing}
          style={{ 
            padding: '10px', 
            border: '1px solid #ccc', 
            borderRadius: '4px',
            opacity: isProcessing ? 0.6 : 1,
            cursor: isProcessing ? 'not-allowed' : 'pointer'
          }}
        />
      </div>

      {/* 进度条显示 */}
      {isProcessing && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            width: '100%',
            backgroundColor: '#e0e0e0',
            borderRadius: '10px',
            overflow: 'hidden',
            height: '20px'
          }}>
            <div style={{
              width: `${progress}%`,
              backgroundColor: '#4CAF50',
              height: '100%',
              transition: 'width 0.3s ease',
              borderRadius: '10px'
            }}></div>
          </div>
          <p style={{ textAlign: 'center', margin: '5px 0', fontSize: '14px' }}>
            {progress}%
          </p>
        </div>
      )}

      <div style={{ 
        marginBottom: '20px', 
        padding: '10px', 
        backgroundColor: isProcessing ? '#e3f2fd' : '#f5f5f5', 
        borderRadius: '4px',
        border: isProcessing ? '2px solid #2196F3' : '1px solid #ddd'
      }}>
        <strong>状态:</strong> {status || '请选择一个PDF文件进行测试'}
      </div>

      {result && (
        <div style={{ marginBottom: '20px' }}>
          <h3>解析结果:</h3>
          <div style={{ 
            padding: '15px', 
            backgroundColor: result.success ? '#e8f5e8' : '#ffeaea', 
            borderRadius: '5px',
            border: `1px solid ${result.success ? '#4CAF50' : '#f44336'}`,
            marginBottom: '15px'
          }}>
            <p><strong>成功:</strong> <span style={{ color: result.success ? 'green' : 'red' }}>
              {result.success ? '✅ 是' : '❌ 否'}
            </span></p>
            <p><strong>标题:</strong> {result.title}</p>
            <p><strong>内容长度:</strong> {result.content?.length || 0} 字符</p>
            {result.metadata && (
              <div>
                <p><strong>页数:</strong> {result.metadata.pageCount}</p>
                <p><strong>字数:</strong> {result.metadata.wordCount}</p>
              </div>
            )}
            {result.error && (
              <p style={{ color: 'red', marginTop: '10px' }}>
                <strong>错误信息:</strong> {result.error}
              </p>
            )}
          </div>
          
          {result.success && result.content && (
            <div style={{ marginTop: '20px' }}>
              <h4>提取的文本内容 (前500字符):</h4>
              <div style={{ 
                backgroundColor: '#fff', 
                border: '1px solid #ddd', 
                padding: '15px', 
                borderRadius: '4px',
                maxHeight: '200px',
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                fontSize: '14px',
                lineHeight: '1.5'
              }}>
                {result.content.substring(0, 500)}
                {result.content.length > 500 && '...'}
              </div>
            </div>
          )}
          
          {/* JSON详细信息 (可折叠) */}
          <details style={{ marginTop: '15px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#666' }}>
              查看详细JSON数据
            </summary>
            <pre style={{ 
              backgroundColor: '#f0f0f0', 
              padding: '10px', 
              borderRadius: '4px', 
              overflow: 'auto',
              maxHeight: '300px',
              fontSize: '12px',
              marginTop: '10px'
            }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      )}

      <div style={{ 
        marginTop: '30px', 
        padding: '15px', 
        backgroundColor: '#fff3cd', 
        border: '1px solid #ffeaa7',
        borderRadius: '5px'
      }}>
        <h4>🚀 优化功能说明:</h4>
        <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.6' }}>
          <li><strong>分批处理:</strong> 大文档按页面分批解析，避免内存溢出</li>
          <li><strong>实时进度:</strong> 显示详细的解析进度和状态信息</li>
          <li><strong>错误恢复:</strong> 单页解析失败时会尝试恢复，不影响整体解析</li>
          <li><strong>性能优化:</strong> 大文档处理过程中主动进行内存管理</li>
          <li><strong>分块读取:</strong> 大文件({'>'}10MB)采用分块读取，避免浏览器崩溃</li>
          <li><strong>智能批次:</strong> 根据文档大小自动调整处理批次大小</li>
        </ul>
      </div>

      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#e8f4fd', borderRadius: '4px' }}>
        <h4>🔍 调试步骤:</h4>
        <ol style={{ lineHeight: '1.6' }}>
          <li>打开浏览器开发者工具 (F12)</li>
          <li>切换到 Console 标签</li>
          <li>选择一个PDF文件上传（建议先测试小文件，再测试大文件）</li>
          <li>观察控制台的详细日志输出和进度信息</li>
          <li>观察页面上的实时进度条和状态更新</li>
          <li>如果失败，查看具体的错误信息和建议</li>
        </ol>
        
        <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
          <strong>💡 测试建议:</strong>
          <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
            <li>先用小PDF文件（{'<'}5MB）测试基本功能</li>
            <li>然后尝试中等大小文件（5-15MB）观察进度显示</li>
            <li>测试大文件（15-20MB）验证内存优化效果</li>
            <li><strong>超大文档测试</strong>：字数3万+的文档会启用高级截取策略</li>
            <li>如遇到问题，查看控制台的详细错误信息和截取日志</li>
          </ul>
          
          <div style={{ marginTop: '10px', padding: '8px', backgroundColor: '#fff9c4', borderRadius: '4px', fontSize: '12px' }}>
            <strong>🔥 超大文档处理：</strong>
            <br />对于《无穷的开始》等4万字长篇文档，系统会：
            <br />• 自动检测章节结构
            <br />• 智能提取代表性内容
            <br />• 基于章节进行结构化截取
            <br />• 为AI提供12000字符的处理空间
          </div>
        </div>
      </div>

      {/* 调试控制台日志显示 */}
      {debugLogs.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>🔍 调试日志</h3>
          <div style={{
            backgroundColor: '#1e1e1e',
            color: '#00ff00',
            padding: '15px',
            borderRadius: '5px',
            fontFamily: 'Monaco, monospace',
            fontSize: '12px',
            maxHeight: '300px',
            overflowY: 'auto',
            border: '1px solid #333'
          }}>
            {debugLogs.map((log, index) => (
              <div key={index} style={{ marginBottom: '2px' }}>
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 