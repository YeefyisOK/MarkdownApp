const SCREENSHOT_CONTENT = {
  home: [
    {
      fileName: 'AI助手问答.md',
      content: `# DeepSeek 问答精选

## 如何优化React性能？
React性能优化的关键点：
1. 使用memo和useMemo
2. 合理使用useCallback
3. 避免不必要的重渲染

\`\`\`javascript
// 优化示例代码
const MemoizedComponent = React.memo(({data}) => {
  return <div>{data}</div>
});
\`\`\`

## 什么是设计模式？
设计模式是软件开发中的最佳实践...`
    },
    {
      fileName: '技术笔记.md',
      content: '# Docker 入门指南...'
    },
    {
      fileName: '学习计划.md',
      content: '# 2024学习计划...'
    }
  ],
  
  editor: `# AI 助手使用技巧

## 1. 提示词优化
良好的提示词能帮助获得更好的回答：
- 明确具体的问题
- 提供必要的上下文
- 说明预期的输出格式

## 2. 代码生成
\`\`\`javascript
// 示例代码
function optimizePrompt(prompt) {
  return {
    context: "开发环境...",
    question: prompt,
    format: "markdown"
  }
}
\`\`\`

## 3. 最佳实践
1. 分步骤提问
2. 及时总结归纳
3. 持续优化提示`,

  preview: `# DeepSeek 使用心得

深度学习助手让编程更高效！

## 优势特点
1. 代码理解深入
2. 回答逻辑清晰
3. 上下文连贯性好

## 实际案例
\`\`\`python
def example():
    print("Hello AI")
\`\`\`

> 持续学习，不断进步`
};

module.exports = {
  SCREENSHOT_CONTENT
}; 