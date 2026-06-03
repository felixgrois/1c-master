
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  return (
    <div 
      className={`markdown-body break-words whitespace-normal select-text ${className}`} 
      style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
    >
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ node, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer" />
          ),
          img: ({ node, ...props }) => (
            <img 
              {...props} 
              className="max-w-full h-auto rounded-3xl mx-auto shadow-lg my-8 border-4 border-white" 
              referrerPolicy="no-referrer" 
            />
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
