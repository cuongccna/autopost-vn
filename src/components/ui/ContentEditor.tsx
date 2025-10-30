'use client';

import { useState, useRef } from 'react';
import { Bold, Italic, Smile } from 'lucide-react';

interface ContentEditorProps {
  value: string;
  onChange: (_value: string) => void;
  placeholder?: string;
  maxLength?: number;
}

// Unicode bold mapping - Facebook-friendly formatting
const BOLD_MAP: { [key: string]: string } = {
  'a': '𝗮', 'b': '𝗯', 'c': '𝗰', 'd': '𝗱', 'e': '𝗲', 'f': '𝗳', 'g': '𝗴', 'h': '𝗵', 'i': '�',
  'j': '𝗷', 'k': '𝗸', 'l': '𝗹', 'm': '𝗺', 'n': '𝗻', 'o': '𝗼', 'p': '𝗽', 'q': '𝗾', 'r': '𝗿',
  's': '𝘀', 't': '𝘁', 'u': '𝘂', 'v': '𝘃', 'w': '𝘄', 'x': '𝘅', 'y': '𝘆', 'z': '𝘇',
  'A': '𝗔', 'B': '𝗕', 'C': '𝗖', 'D': '𝗗', 'E': '𝗘', 'F': '𝗙', 'G': '𝗚', 'H': '𝗛', 'I': '𝗜',
  'J': '𝗝', 'K': '𝗞', 'L': '𝗟', 'M': '𝗠', 'N': '𝗡', 'O': '𝗢', 'P': '𝗣', 'Q': '𝗤', 'R': '𝗥',
  'S': '𝗦', 'T': '𝗧', 'U': '𝗨', 'V': '𝗩', 'W': '𝗪', 'X': '𝗫', 'Y': '𝗬', 'Z': '𝗭',
  '0': '𝟬', '1': '𝟭', '2': '𝟮', '3': '𝟯', '4': '�', '5': '𝟱', '6': '𝟲', '7': '𝟳', '8': '𝟴', '9': '𝟵'
};

// Unicode italic mapping
const ITALIC_MAP: { [key: string]: string } = {
  'a': '𝘢', 'b': '𝘣', 'c': '𝘤', 'd': '𝘥', 'e': '𝘦', 'f': '𝘧', 'g': '𝘨', 'h': '�', 'i': '𝘪',
  'j': '𝘫', 'k': '𝘬', 'l': '𝘭', 'm': '𝘮', 'n': '𝘯', 'o': '𝘰', 'p': '𝘱', 'q': '𝘲', 'r': '𝘳',
  's': '𝘴', 't': '𝘵', 'u': '𝘶', 'v': '𝘷', 'w': '𝘸', 'x': '𝘹', 'y': '𝘺', 'z': '𝘻',
  'A': '𝘈', 'B': '𝘉', 'C': '𝘊', 'D': '𝘋', 'E': '𝘌', 'F': '𝘍', 'G': '𝘎', 'H': '𝘏', 'I': '𝘐',
  'J': '𝘑', 'K': '�', 'L': '𝘓', 'M': '𝘔', 'N': '𝘕', 'O': '𝘖', 'P': '𝘗', 'Q': '𝘘', 'R': '𝘙',
  'S': '𝘚', 'T': '𝘛', 'U': '𝘜', 'V': '𝘝', 'W': '𝘞', 'X': '𝘟', 'Y': '𝘠', 'Z': '𝘡'
};

const EMOJI_CATEGORIES = {
  'Cảm xúc': ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳'],
  'Hoạt động': ['👍', '👎', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🦷', '🦴', '👀', '👁️', '👅', '👄', '💋', '🩸'],
  'Kinh doanh': ['💼', '💰', '💵', '💴', '💶', '💷', '💳', '💎', '⚖️', '🛠️', '🔧', '🔨', '⛏️', '🛡️', '⚔️', '💣', '🏹', '🛡️', '🔪', '🗡️', '⚱️', '🏺', '🗿', '🛕', '🕌', '🛤️'],
  'Xu hướng': ['🔥', '💯', '✨', '⭐', '🌟', '💫', '⚡', '☄️', '💥', '🔆', '🔅', '☀️', '🌤️', '⛅', '🌦️', '🌧️', '⛈️', '🌩️', '🌨️', '❄️', '☃️', '⛄', '🌬️', '💨', '🌪️', '🌈', '☔', '💧', '💦', '🌊']
};

export default function ContentEditor({ value, onChange, placeholder, maxLength = 2000 }: ContentEditorProps) {
  const [showEmojis, setShowEmojis] = useState(false);
  const [activeEmojiCategory, setActiveEmojiCategory] = useState('Cảm xúc');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Apply Unicode bold formatting to selected text
  const applyBold = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.slice(start, end);

    if (!selectedText) {
      alert('Vui lòng chọn đoạn text cần bôi đậm trước!');
      return;
    }

    const boldText = selectedText
      .split('')
      .map(char => BOLD_MAP[char] || char)
      .join('');

    const newValue = value.slice(0, start) + boldText + value.slice(end);
    onChange(newValue);

    setTimeout(() => {
      textarea.setSelectionRange(start, start + boldText.length);
      textarea.focus();
    }, 0);
  };

  // Apply Unicode italic formatting to selected text
  const applyItalic = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.slice(start, end);

    if (!selectedText) {
      alert('Vui lòng chọn đoạn text cần in nghiêng trước!');
      return;
    }

    const italicText = selectedText
      .split('')
      .map(char => ITALIC_MAP[char] || char)
      .join('');

    const newValue = value.slice(0, start) + italicText + value.slice(end);
    onChange(newValue);

    setTimeout(() => {
      textarea.setSelectionRange(start, start + italicText.length);
      textarea.focus();
    }, 0);
  };

  // Insert emoji at cursor position
  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const newValue = value.slice(0, start) + emoji + value.slice(end);
    onChange(newValue);

    setTimeout(() => {
      const newPos = start + emoji.length;
      textarea.setSelectionRange(newPos, newPos);
      textarea.focus();
    }, 0);

    setShowEmojis(false);
  };

  return (
    <div className="space-y-3">
      {/* Formatting Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 rounded-lg border">
        {/* Bold Button */}
        <button
          onClick={applyBold}
          title="In đậm (chọn text trước)"
          className="w-9 h-9 flex items-center justify-center rounded bg-white border hover:bg-indigo-100 hover:border-indigo-500 transition-colors"
        >
          <Bold className="w-4 h-4" />
        </button>

        {/* Italic Button */}
        <button
          onClick={applyItalic}
          title="In nghiêng (chọn text trước)"
          className="w-9 h-9 flex items-center justify-center rounded bg-white border hover:bg-indigo-100 hover:border-indigo-500 transition-colors"
        >
          <Italic className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-300" />

        {/* Emoji Button */}
        <div className="relative">
          <button
            onClick={() => setShowEmojis(!showEmojis)}
            className="w-9 h-9 flex items-center justify-center rounded bg-white border hover:bg-gray-100 transition-colors"
            title="Chèn emoji"
          >
            <Smile className="w-4 h-4" />
          </button>

          {/* Emoji Picker */}
          {showEmojis && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowEmojis(false)}
              />
              <div className="absolute top-10 left-0 z-20 w-80 bg-white border rounded-lg shadow-lg">
                {/* Emoji Categories */}
                <div className="flex border-b">
                  {Object.keys(EMOJI_CATEGORIES).map((category) => (
                    <button
                      key={category}
                      onClick={() => setActiveEmojiCategory(category)}
                      className={`flex-1 px-3 py-2 text-xs font-medium ${
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
                        className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-xl transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Character Count */}
        <div className="ml-auto text-sm text-gray-500">
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
      </div>

      {/* Helper Text */}
      <p className="text-xs text-gray-500">
        💡 Chọn text rồi nhấn <strong>Bold</strong> hoặc <strong>Italic</strong> để format Unicode
      </p>
    </div>
  );
}
