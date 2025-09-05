'use client';

import { PROVIDERS } from '@/lib/constants';

interface Post {
  id: string;
  title: string;
  datetime: string;
  providers: string[];
  status: 'scheduled' | 'published' | 'failed';
}

interface QueueProps {
  posts: Post[];
}

export default function Queue({ posts }: QueueProps) {
  const sortedPosts = [...posts].sort(
    (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
  );

  return (
    <section className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <div className="text-base font-semibold">Hàng đợi</div>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
          {posts.length}
        </span>
      </div>
      <div className="divide-y">
        {sortedPosts.map(post => (
          <div key={post.id} className="flex items-center justify-between py-3">
            <div>
              <div className="font-medium">{post.title}</div>
              <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                <span>
                  {new Date(post.datetime).toLocaleString([], {
                    hour: '2-digit',
                    minute: '2-digit', 
                    day: '2-digit',
                    month: '2-digit'
                  })}
                </span>
                <span>•</span>
                <span className="flex gap-1">
                  {post.providers.map(provider => (
                    <span
                      key={provider}
                      className={`rounded-md px-1.5 py-0.5 text-[10px] ${
                        PROVIDERS[provider as keyof typeof PROVIDERS]?.chip || 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {PROVIDERS[provider as keyof typeof PROVIDERS]?.tag || provider.toUpperCase()}
                    </span>
                  ))}
                </span>
              </div>
            </div>
            {post.status === 'scheduled' && (
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700">
                scheduled
              </span>
            )}
          </div>
        ))}
        {posts.length === 0 && (
          <div className="py-8 text-center text-gray-500">
            Chưa có bài đăng nào trong hàng đợi
          </div>
        )}
      </div>
    </section>
  );
}
