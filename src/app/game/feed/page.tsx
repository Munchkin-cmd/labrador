'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link' // ✅ Import do Link
import { useFeed, CATEGORIES, Article } from '@/hooks/useFeed'
import { formatTime } from '@/utils/format'

export default function FeedPage() {
  const { articles, loading, hasMore, loadMore, voteArticle, publishArticle, fetchComments, postComment } = useFeed()
  const [openArticle, setOpen] = useState<Article | null>(null)

  return (
    <div className="flex flex-col pb-6 min-h-screen">

      {/* Header da aba */}
      <div className="px-4 pt-4 pb-2">
        <p className="text-xs font-bold tracking-widest text-white/40 uppercase">FEED GLOBAL</p>
      </div>

      {/* Lista de artigos */}
      <div className="flex flex-col gap-3 px-4">
        {loading && articles.length === 0 && (
          <div className="flex flex-col gap-3">
            {[1,2,3].map(i => <ArticleSkeleton key={i} />)}
          </div>
        )}

        {articles.map(article => (
          <ArticleCard
            key={article.id}
            article={article}
            onVote={voteArticle}
            onOpen={() => setOpen(article)}
          />
        ))}

        {hasMore && (
          <button onClick={loadMore} disabled={loading}
            className="text-white/40 text-sm text-center py-3 hover:text-white/60 transition-colors">
            {loading ? 'Carregando...' : 'Carregar mais...'}
          </button>
        )}

        {!loading && articles.length === 0 && (
          <div className="text-center py-16 text-white/30">
            <p className="text-4xl mb-3">📰</p>
            <p className="text-sm">Nenhum artigo publicado ainda.</p>
            <p className="text-xs mt-1">Seja o primeiro!</p>
          </div>
        )}
      </div>

      {/* ✅ FAB - REDIRECIONA PARA A PÁGINA SEPARADA */}
      <Link
        href="/game/feed/novo-artigo"
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-primary shadow-lg
                   flex items-center justify-center text-2xl text-white z-30
                   hover:bg-primary-light transition-colors active:scale-95"
      >
        +
      </Link>

      {/* Modal artigo aberto */}
      {openArticle && (
        <ArticleModal
          article={openArticle}
          onClose={() => setOpen(null)}
          onVote={voteArticle}
          fetchComments={fetchComments}
          postComment={postComment}
        />
      )}
    </div>
  )
}

// ── Article Card ─────────────────────────────────────────────
function ArticleCard({ article, onVote, onOpen }: {
  article: Article
  onVote: (id: string, v: 1 | -1) => void
  onOpen: () => void
}) {
  return (
    <div className="bg-surface-card rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-xl">{article.countries?.flag_emoji ?? '🌐'}</span>
        <div className="flex-1 min-w-0">
          <p className="text-white/70 text-xs font-semibold truncate">{article.countries?.name}</p>
          <p className="text-white/30 text-xs">{formatTime(article.created_at)}</p>
        </div>
        <span className="text-xs bg-white/10 text-white/50 rounded-full px-2 py-0.5">{article.category}</span>
      </div>

      <button onClick={onOpen} className="text-left">
        <h3 className="text-white font-bold text-base leading-snug line-clamp-2 hover:text-primary-light transition-colors">
          {article.title}
        </h3>
        {article.content && (
          <p className="text-white/40 text-sm mt-1 line-clamp-2">{article.content}</p>
        )}
      </button>

      <div className="flex items-center gap-3 pt-1 border-t border-white/5">
        <button
          onClick={() => onVote(article.id, 1)}
          className={`flex items-center gap-1.5 text-sm font-semibold transition-colors
            ${article.user_vote === 1 ? 'text-green-400' : 'text-white/40 hover:text-green-400'}`}
        >
          👍 <span>{article.likes}</span>
        </button>
        <button
          onClick={() => onVote(article.id, -1)}
          className={`flex items-center gap-1.5 text-sm font-semibold transition-colors
            ${article.user_vote === -1 ? 'text-red-400' : 'text-white/40 hover:text-red-400'}`}
        >
          👎 <span>{article.dislikes}</span>
        </button>
        <button onClick={onOpen} className="text-white/30 text-sm ml-auto hover:text-white/60 transition-colors">
          💬 Ver artigo
        </button>
      </div>
    </div>
  )
}

// ── Article Modal (with comments) ────────────────────────────
function ArticleModal({ article, onClose, onVote, fetchComments, postComment }: {
  article: Article
  onClose: () => void
  onVote: (id: string, v: 1 | -1) => void
  fetchComments: (id: string) => Promise<any[]>
  postComment: (id: string, content: string, parentId?: string) => Promise<void>
}) {
  const [comments, setComments] = useState<any[]>([])
  const [loaded, setLoaded]     = useState(false)
  const [reply, setReply]       = useState('')
  const [sending, setSending]   = useState(false)

  async function loadComments() {
    const c = await fetchComments(article.id)
    setComments(c)
    setLoaded(true)
  }

  useEffect(() => {
    loadComments()
  }, [article.id])

  async function handleComment() {
    if (!reply.trim()) return
    setSending(true)
    await postComment(article.id, reply)
    setReply('')
    await loadComments()
    setSending(false)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end">
      <div className="bg-surface-card w-full rounded-t-2xl flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <span className="text-white/50 text-sm">{article.countries?.name} · {article.category}</span>
          <button onClick={onClose} className="text-white/40 text-xl">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          <h2 className="text-white font-black text-lg leading-snug">{article.title}</h2>
          <p className="text-white/70 text-sm leading-relaxed">{article.content}</p>

          <div className="flex gap-3 py-2 border-t border-white/5">
            <button onClick={() => onVote(article.id, 1)}
              className={`flex items-center gap-1.5 text-sm font-semibold ${article.user_vote === 1 ? 'text-green-400' : 'text-white/40'}`}>
              👍 {article.likes}
            </button>
            <button onClick={() => onVote(article.id, -1)}
              className={`flex items-center gap-1.5 text-sm font-semibold ${article.user_vote === -1 ? 'text-red-400' : 'text-white/40'}`}>
              👎 {article.dislikes}
            </button>
          </div>

          <p className="text-xs font-bold tracking-widest text-white/40 uppercase">COMENTÁRIOS</p>
          {!loaded && <p className="text-white/30 text-sm">Carregando...</p>}
          {comments.map(c => (
            <div key={c.id} className="flex gap-2 py-2 border-b border-white/5">
              <span className="text-base">{c.countries?.flag_emoji ?? '🌐'}</span>
              <div>
                <p className="text-white/60 text-xs font-semibold">{c.countries?.name}</p>
                <p className="text-white/80 text-sm mt-0.5">{c.content}</p>
              </div>
            </div>
          ))}
          {loaded && comments.length === 0 && (
            <p className="text-white/20 text-sm text-center">Sem comentários ainda</p>
          )}
        </div>

        <div className="border-t border-white/5 p-4 flex gap-2">
          <input
            value={reply}
            onChange={e => setReply(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleComment()}
            placeholder="Comentar..."
            className="flex-1 input-field py-2 text-sm"
          />
          <button onClick={handleComment} disabled={sending || !reply.trim()}
            className="bg-primary text-white rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-30">
            ➤
          </button>
        </div>
      </div>
    </div>
  )
}

function ArticleSkeleton() {
  return (
    <div className="bg-surface-card rounded-xl p-4 flex flex-col gap-3 animate-pulse">
      <div className="flex gap-2 items-center">
        <div className="w-8 h-8 rounded-full bg-white/10" />
        <div className="h-3 w-24 bg-white/10 rounded" />
      </div>
      <div className="h-4 w-3/4 bg-white/10 rounded" />
      <div className="h-3 w-full bg-white/5 rounded" />
    </div>
  )
}
