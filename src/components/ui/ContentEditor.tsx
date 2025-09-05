'use client';

import { useState, useRef } from 'react';

interface ContentEditorProps {
  value: string;
  onChange: (_value: string) => void;
  placeholder?: string;
  maxLength?: number;
}

const FORMATTING_TOOLS = [
  { 
    id: 'bold', 
    icon: '𝐁', 
    label: 'Đậm',
    wrap: (text: string) => `**${text}**`
  },
  { 
    id: 'italic', 
    icon: '𝐼', 
    label: 'Nghiêng',
    wrap: (text: string) => `*${text}*`
  },
  { 
    id: 'underline', 
    icon: '𝐔', 
    label: 'Gạch chân',
    wrap: (text: string) => `__${text}__`
  },
  { 
    id: 'strikethrough', 
    icon: '𝐒', 
    label: 'Gạch ngang',
    wrap: (text: string) => `~~${text}~~`
  }
];

const EMOJI_CATEGORIES = {
  'Cảm xúc': ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳'],
  'Hoạt động': ['👍', '👎', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🦷', '🦴', '👀', '👁️', '👅', '👄', '💋', '🩸'],
  'Kinh doanh': ['💼', '💰', '💵', '💴', '💶', '💷', '💳', '💎', '⚖️', '🛠️', '🔧', '🔨', '⛏️', '🛡️', '⚔️', '💣', '🏹', '🛡️', '🔪', '🗡️', '⚱️', '🏺', '🗿', '🛕', '🕌', '🛤️'],
  'Xu hướng': ['🔥', '💯', '✨', '⭐', '🌟', '💫', '⚡', '☄️', '💥', '🔆', '🔅', '☀️', '🌤️', '⛅', '🌦️', '🌧️', '⛈️', '🌩️', '🌨️', '❄️', '☃️', '⛄', '🌬️', '💨', '🌪️', '🌈', '☔', '💧', '💦', '🌊']
};

const HEADING_STYLES = [
  { id: 'h1', label: 'Tiêu đề lớn', prefix: '# ' },
  { id: 'h2', label: 'Tiêu đề vừa', prefix: '## ' },
  { id: 'h3', label: 'Tiêu đề nhỏ', prefix: '### ' },
  { id: 'quote', label: 'Trích dẫn', prefix: '> ' },
  { id: 'list', label: 'Danh sách', prefix: '• ' }
];

export default function ContentEditor({ value, onChange, placeholder, maxLength = 2000 }: ContentEditorProps) {
  const [showEmojis, setShowEmojis] = useState(false);
  const [activeEmojiCategory, setActiveEmojiCategory] = useState('Cảm xúc');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertText = (textToInsert: string, shouldSelect = false) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = value.slice(0, start) + textToInsert + value.slice(end);
    
    onChange(newValue);
    
    // Set cursor position after insertion
    setTimeout(() => {
      if (shouldSelect) {
        textarea.setSelectionRange(start, start + textToInsert.length);
      } else {
        textarea.setSelectionRange(start + textToInsert.length, start + textToInsert.length);
      }
      textarea.focus();
    }, 0);
  };

  const applyFormatting = (tool: typeof FORMATTING_TOOLS[0]) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.slice(start, end);

    if (selectedText) {
      const formattedText = tool.wrap(selectedText);
      const newValue = value.slice(0, start) + formattedText + value.slice(end);
      onChange(newValue);
      
      setTimeout(() => {
        textarea.setSelectionRange(start, start + formattedText.length);
        textarea.focus();
      }, 0);
    } else {
      // If no text selected, insert placeholder
      const placeholder = tool.wrap('văn bản');
      insertText(placeholder, true);
    }
  };

  const applyHeading = (style: typeof HEADING_STYLES[0]) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = value.indexOf('\n', start);
    const endPos = lineEnd === -1 ? value.length : lineEnd;
    
    const currentLine = value.slice(lineStart, endPos);
    const newLine = style.prefix + currentLine.replace(/^(#{1,3}\s|>\s|•\s)/, '');
    
    const newValue = value.slice(0, lineStart) + newLine + value.slice(endPos);
    onChange(newValue);
    
    setTimeout(() => {
      const newCursorPos = lineStart + newLine.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      textarea.focus();
    }, 0);
  };

  const insertEmoji = (emoji: string) => {
    insertText(emoji);
    setShowEmojis(false);
  };

  return (
    <div className="space-y-3">
      {/* Formatting Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 rounded-lg border">
        {/* Text Formatting */}
        <div className="flex gap-1">
          {FORMATTING_TOOLS.map((tool) => (
            <button
              key={tool.id}
              onClick={() => applyFormatting(tool)}
              title={tool.label}
              className="w-8 h-8 flex items-center justify-center rounded bg-white border hover:bg-gray-100 text-sm font-bold"
            >
              {tool.icon}
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-gray-300" />

        {/* Heading Styles */}
        <div className="flex gap-1">
          {HEADING_STYLES.map((style) => (
            <button
              key={style.id}
              onClick={() => applyHeading(style)}
              title={style.label}
              className="px-2 py-1 text-xs bg-white border rounded hover:bg-gray-100"
            >
              {style.label}
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-gray-300" />

        {/* Emoji Button */}
        <div className="relative">
          <button
            onClick={() => setShowEmojis(!showEmojis)}
            className="w-8 h-8 flex items-center justify-center rounded bg-white border hover:bg-gray-100"
            title="Chèn emoji"
          >
            😀
          </button>

          {/* Emoji Picker */}
          {showEmojis && (
            <div className="absolute top-10 left-0 z-10 w-80 bg-white border rounded-lg shadow-lg">
              {/* Emoji Categories */}
              <div className="flex border-b">
                {Object.keys(EMOJI_CATEGORIES).map((category) => (
                  <button
                    key={category}
                    onClick={() => setActiveEmojiCategory(category)}
                    className={`flex-1 px-3 py-2 text-xs ${
                      activeEmojiCategory === category
                        ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              {/* Emoji Grid */}
              <div className="p-3 max-h-48 overflow-y-auto">
                <div className="grid grid-cols-8 gap-1">
                  {EMOJI_CATEGORIES[activeEmojiCategory as keyof typeof EMOJI_CATEGORIES].map((emoji, index) => (
                    <button
                      key={index}
                      onClick={() => insertEmoji(emoji)}
                      className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-lg"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Character Count */}
        <div className="ml-auto text-xs text-gray-500">
          {value.length}/{maxLength}
        </div>
      </div>

      {/* Text Area */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "Viết nội dung của bạn..."}
          className="w-full min-h-[200px] p-4 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          maxLength={maxLength}
        />

        {/* Click outside to close emoji picker */}
        {showEmojis && (
          <div
            className="fixed inset-0 z-5"
            onClick={() => setShowEmojis(false)}
          />
        )}
      </div>

      {/* Preview */}
      {value && (
        <div className="mt-4">
          <div className="text-sm font-medium text-gray-700 mb-2">Preview:</div>
          <div className="p-3 bg-gray-50 rounded-lg border">
            <div className="whitespace-pre-wrap text-sm">
              {value
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/__(.*?)__/g, '<u>$1</u>')
                .replace(/~~(.*?)~~/g, '<del>$1</del>')
                .replace(/^# (.*$)/gm, '<h1 class="text-xl font-bold">$1</h1>')
                .replace(/^## (.*$)/gm, '<h2 class="text-lg font-semibold">$1</h2>')
                .replace(/^### (.*$)/gm, '<h3 class="text-base font-medium">$1</h3>')
                .replace(/^> (.*$)/gm, '<blockquote class="border-l-4 border-gray-300 pl-3 italic">$1</blockquote>')
                .replace(/^• (.*$)/gm, '<li class="ml-4">• $1</li>')
                .split('\n')
                .map((line, i) => (
                  <div key={i} dangerouslySetInnerHTML={{ __html: line || '<br>' }} />
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
