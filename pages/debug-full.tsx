import { useState, useEffect } from 'react';
import { parseDocument } from '../src/utils/documentParser';
import { generateOutline } from '../src/utils/aiService';
import { getAPIConfig } from '../src/utils/storage';

export default function DebugFull() {
  const [status, setStatus] = useState<string>('');
  const [parseResult, setParseResult] = useState<any>(null);
  const [outlineResult, setOutlineResult] = useState<any>(null);
  const [apiConfig, setApiConfig] = useState({
    provider: 'openai',
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-3.5-turbo'
  });

  // 加载本地API配置
  useEffect(() => {
    const savedConfig = getAPIConfig();
    if (savedConfig) {
      setApiConfig({
        provider: savedConfig.provider,
        apiKey: savedConfig.apiKey,
        baseUrl: savedConfig.baseUrl,
        model: savedConfig.model
      });
    }
  }, []);

  const updateStatus = (msg: string) => {
    setStatus(prev => prev + '\n' + new Date().toLocaleTimeString() + ': ' + msg);
    console.log(msg);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setStatus('');
    setParseResult(null);
    setOutlineResult(null);

    try {
      // 步骤1: 解析文档
      updateStatus(`开始解析文件: ${file.name} (${file.type}, ${(file.size / 1024 / 1024).toFixed(2)}MB)`);
      
      const parseRes = await parseDocument(file);
      setParseResult(parseRes);
      
      if (!parseRes.success) {
        updateStatus(`❌ 文档解析失败: ${parseRes.error}`);
        return;
      }
      
      updateStatus(`✅ 文档解析成功! 提取了 ${parseRes.content?.length || 0} 个字符`);
      
      // 步骤2: 检查API配置
      const savedConfig = getAPIConfig();
      if (!savedConfig || !savedConfig.apiKey) {
        updateStatus(`❌ 请先在应用中配置API Key (访问 /upload 页面配置)`);
        return;
      }

      updateStatus(`✅ 使用已保存的API配置: ${savedConfig.provider} - ${savedConfig.model}`);

      // 步骤3: 生成大纲
      updateStatus(`开始生成学习大纲...`);
      
      const outlineRes = await generateOutline(savedConfig, parseRes.content!, '测试文档');
      setOutlineResult(outlineRes);
      
      updateStatus(`✅ 大纲生成成功! 共 ${Array.isArray(outlineRes) ? outlineRes.length : '未知'} 个章节`);

    } catch (error) {
      updateStatus(`❌ 处理失败: ${error instanceof Error ? error.message : '未知错误'}`);
      console.error('完整错误信息:', error);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>完整流程调试工具</h1>
      
      {/* API配置 */}
      <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc' }}>
        <h3>API配置</h3>
        <div style={{ marginBottom: '10px' }}>
          <label>Provider: </label>
          <select 
            value={apiConfig.provider} 
            onChange={(e) => setApiConfig({...apiConfig, provider: e.target.value})}
          >
            <option value="openai">OpenAI</option>
            <option value="deepseek">DeepSeek</option>
            <option value="claude">Claude</option>
          </select>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>API Key: </label>
          <input 
            type="password" 
            value={apiConfig.apiKey}
            onChange={(e) => setApiConfig({...apiConfig, apiKey: e.target.value})}
            placeholder="输入API Key"
            style={{ width: '300px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Base URL: </label>
          <input 
            type="text" 
            value={apiConfig.baseUrl}
            onChange={(e) => setApiConfig({...apiConfig, baseUrl: e.target.value})}
            style={{ width: '300px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Model: </label>
          <input 
            type="text" 
            value={apiConfig.model}
            onChange={(e) => setApiConfig({...apiConfig, model: e.target.value})}
            style={{ width: '300px' }}
          />
        </div>
      </div>

      {/* 文件上传 */}
      <div style={{ marginBottom: '20px' }}>
        <input type="file" accept=".pdf,.doc,.docx,.txt,.md" onChange={handleFileUpload} />
      </div>

      {/* 状态显示 */}
      <div style={{ marginBottom: '20px' }}>
        <h3>处理状态:</h3>
        <pre style={{ 
          backgroundColor: '#f5f5f5', 
          padding: '10px', 
          height: '200px', 
          overflow: 'auto',
          whiteSpace: 'pre-wrap'
        }}>
          {status}
        </pre>
      </div>

      {/* 解析结果 */}
      {parseResult && (
        <div style={{ marginBottom: '20px' }}>
          <h3>文档解析结果:</h3>
          <div style={{ backgroundColor: '#f0f8ff', padding: '10px' }}>
            <p><strong>成功:</strong> {parseResult.success ? '是' : '否'}</p>
            {parseResult.error && <p><strong>错误:</strong> {parseResult.error}</p>}
            {parseResult.content && (
              <>
                <p><strong>内容长度:</strong> {parseResult.content.length} 字符</p>
                <p><strong>前100字符:</strong></p>
                <pre style={{ backgroundColor: 'white', padding: '5px', fontSize: '12px' }}>
                  {parseResult.content.substring(0, 100)}...
                </pre>
              </>
            )}
          </div>
        </div>
      )}

      {/* 大纲结果 */}
      {outlineResult && (
        <div style={{ marginBottom: '20px' }}>
          <h3>大纲生成结果:</h3>
          <div style={{ backgroundColor: '#f0fff0', padding: '10px' }}>
            <p><strong>章节数量:</strong> {outlineResult.length}</p>
            <pre style={{ backgroundColor: 'white', padding: '5px', fontSize: '12px' }}>
              {JSON.stringify(outlineResult, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
} 