import { useState, useEffect } from 'react';
import { generateOutline } from '../src/utils/aiService';
import { getAPIConfig } from '../src/utils/storage';

export default function DebugOutline() {
  const [status, setStatus] = useState<string>('');
  const [result, setResult] = useState<any>(null);
  const [content, setContent] = useState<string>(`
华润啤酒（控股）有限公司简介

华润啤酒是华润集团旗下的啤酒业务旗舰，成立于1993年，是中国最大的啤酒企业之一。公司主要从事啤酒的生产、销售以及相关业务的投资控股。

1. 基本情况
华润啤酒总部位于北京，在全国拥有数十家啤酒厂，生产能力位居行业前列。公司旗下拥有雪花啤酒、华润怡宝等知名品牌。

2. 主要产品
- 雪花啤酒：中国销量最大的啤酒品牌
- 喜力啤酒：国际知名啤酒品牌的中国业务
- 其他地方性品牌

3. 市场地位
华润啤酒在中国啤酒市场占有重要地位，市场份额连续多年位居前列，是中国啤酒行业的领军企业之一。

4. 发展战略
公司专注于高端化发展，通过品牌升级、产品创新和渠道优化，不断提升市场竞争力。
  `);

  const updateStatus = (msg: string) => {
    setStatus(prev => prev + '\n' + new Date().toLocaleTimeString() + ': ' + msg);
    console.log(msg);
  };

  const testOutlineGeneration = async () => {
    setStatus('');
    setResult(null);

    try {
      // 检查API配置
      const config = getAPIConfig();
      if (!config || !config.apiKey) {
        updateStatus('❌ 请先配置API Key');
        return;
      }

      updateStatus(`✅ 使用API配置: ${config.provider} - ${config.model}`);
      updateStatus(`开始生成大纲，文档长度: ${content.length} 字符`);

      const outlineResult = await generateOutline(config, content, '华润啤酒简介');
      
      setResult(outlineResult);
      updateStatus(`✅ 大纲生成成功!`);

    } catch (error) {
      updateStatus(`❌ 大纲生成失败: ${error instanceof Error ? error.message : '未知错误'}`);
      console.error('详细错误:', error);
    }
  };

  // 自动加载API配置状态
  const [apiStatus, setApiStatus] = useState<string>('检查中...');
  useEffect(() => {
    const config = getAPIConfig();
    if (config && config.apiKey) {
      setApiStatus(`✅ 已配置: ${config.provider} - ${config.model}`);
    } else {
      setApiStatus('❌ 未配置API Key');
    }
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>AI大纲生成调试工具</h1>
      
      {/* API状态 */}
      <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc' }}>
        <h3>API配置状态</h3>
        <p>{apiStatus}</p>
        {apiStatus.includes('❌') && (
          <p style={{ color: 'red' }}>
            请先访问 <a href="/upload" target="_blank">/upload</a> 页面配置API Key
          </p>
        )}
      </div>

      {/* 测试内容 */}
      <div style={{ marginBottom: '20px' }}>
        <h3>测试文档内容</h3>
        <textarea 
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{ 
            width: '100%', 
            height: '200px', 
            fontFamily: 'monospace',
            fontSize: '12px'
          }}
        />
      </div>

      {/* 测试按钮 */}
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={testOutlineGeneration}
          style={{ 
            padding: '10px 20px', 
            fontSize: '16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          生成大纲
        </button>
      </div>

      {/* 状态显示 */}
      <div style={{ marginBottom: '20px' }}>
        <h3>处理状态:</h3>
        <pre style={{ 
          backgroundColor: '#f5f5f5', 
          padding: '10px', 
          height: '150px', 
          overflow: 'auto',
          whiteSpace: 'pre-wrap'
        }}>
          {status}
        </pre>
      </div>

      {/* 结果显示 */}
      {result && (
        <div style={{ marginBottom: '20px' }}>
          <h3>生成结果:</h3>
          <div style={{ backgroundColor: '#f0fff0', padding: '10px' }}>
            <p><strong>类型:</strong> {Array.isArray(result) ? '数组' : typeof result}</p>
            {Array.isArray(result) && <p><strong>项目数量:</strong> {result.length}</p>}
            <pre style={{ backgroundColor: 'white', padding: '5px', fontSize: '12px', overflow: 'auto', maxHeight: '400px' }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
} 