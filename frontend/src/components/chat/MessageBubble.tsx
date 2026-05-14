import type { Message } from '../../types'

interface MessageBubbleProps {
  message: Message
}

function formatTime(date: string | Date | undefined) {
  if (!date) return ''
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-medium shrink-0 ${
          isUser
            ? 'bg-green-50 dark:bg-green-900/40 text-green-700 dark:text-green-400'
            : 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
        }`}
      >
        {isUser ? 'U' : 'AI'}
      </div>

      <div className={`flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`px-4 py-2.5 text-sm max-w-[72%] ${
            isUser
              ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm'
              : 'bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600 text-gray-800 dark:text-gray-100 rounded-2xl rounded-tl-sm'
          }`}
          style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
        >
          {message.content}
        </div>
        <span className="text-[10px] text-gray-400">
          {formatTime(message.timestamp ?? message.created_at)}
        </span>
      </div>
    </div>
  )
}
