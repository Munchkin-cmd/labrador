'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { useFeed } from '@/hooks/useFeed'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { formatTime } from '@/utils/format'
import { ArrowLeft, Trash2, Pencil } from 'lucide-react'

export default function ArtigoPage() {
  const params = useParams()
  const router = useRouter()
  const { user, country } = useAuthStore()
  const { voteArticle, fetchComments, postComment } = useFeed()
  const id = params.id as string

  const [article, setArticle] = useState<any | null>(null)
  const [comments, setComments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const isAuthor = article?.country_id === country?.id

  useEffect(() => {
    async function loadArticle() {
      if (!id) return
      const { data } = await supabase
        .from('articles')
        .select('*, countries(name, flag_emoji)')
        .eq('id', id)
        .single()
      setArticle(data)
      setLoading(false)
    }
    loadArticle()
  }, [id])

  useEffect(() => {
    async function loadComments() {
      const c = await fetchComments(id)
      setComments(c)
    }
    loadComments()
  }, [id, fetchComments])

  async function handleVote(vote: 1 | -1) {
    if (!article) return
    await voteArticle(article.id, vote)
    // Atualiza localmente
    const newLikes = article.likes + (vote === 1 ? 1 : -1)
    const newDislikes = article.dislikes + (vote === -1 ? 1 : -1)
    setArticle({ ...article, likes: newLikes, dislikes: newDislikes })
  }

  async function handleDelete() {
    if (!confirm('Tem certeza que deseja excluir este artigo?')) return
    setDeleting(true)
    const { error } = await supabase.from('articles').delete().eq('id', id)
    if (!error) {
      router.push('/game/feed')
    } else {
      alert('Erro ao excluir o artigo.')
    }
    setDeleting(false)
  }

  async function handleComment() {
    if (!reply.trim()) return
    setSending(true)
    await postComment(id, reply)
    setReply('')
    const c = await fetchComments(id)
    setComments(c)
    setSending(false)
  }

  if (loading) return <div className="p-8 text-center text-white/40">Carregando artigo...</div>
  if (!article) return <div className="p-8 text-center text-white/40">Artigo não encontrado.</div>

  return (
    <div className="max-w-4xl mx-auto pb-24 px-4">
      {/* Cabeçalho com volta e ações */}
      <div className="flex items-center justify-between mb-6 pt-4">
        <div className="flex items-center gap-3">
          <Link href="/game/feed" className="text-white/50 hover:text-white transition-colors p-2 -ml-2">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-xl font-bold text-white">Artigo</h1>
        </div>

        {/* Botões de ação (apenas para o autor) */}
        {isAuthor && (
          <div className="flex gap-2">
            <Link
              href={`/game/feed/editar/${id}`}
              className="p-2 text-white/50 hover:text-white transition-colors"
            >
              <Pencil size={20} />
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-2 text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
            >
              <Trash2 size={20} />
            </button>
          </div>
        )}
      </div>

      {/* Conteúdo do artigo */}
      <div className="bg-surface-card rounded-xl p-6 border border-white/5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">{article.countries?.flag_emoji ?? '🌐'}</span>
          <span className="text-white/70 text-sm font-semibold">{article.countries?.name}</span>
          <span className="text-white/30 text-xs">{formatTime(article.created_at)}</span>
          <span className="ml-auto text-xs bg-white/10 text-white/50 rounded-full px-2 py-0.5">{article.category}</span>
        </div>

        <h2 className="text-white font-black text-2xl leading-snug mb-4">{article.title}</h2>

        <div className="prose prose-invert prose-sm max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {article.content}
          </ReactMarkdown>
        </div>

        {/* Botões de voto */}
        <div className="flex gap-4 mt-6 pt-4 border-t border-white/5">
          <button
            onClick={() => handleVote(1)}
            className={`flex items-center gap-1.5 text-sm font-semibold transition-colors
              ${article.user_vote === 1 ? 'text-green-400' : 'text-white/40 hover:text-green-400'}`}
          >
            👍 <span>{article.likes}</span>
          </button>
          <button
            onClick={() => handleVote(-1)}
            className={`flex items-center gap-1.5 text-sm font-semibold transition-colors
              ${article.user_vote === -1 ? 'text-red-400' : 'text-white/40 hover:text-red-400'}`}
          >
            👎 <span>{article.dislikes}</span>
          </button>
        </div>
      </div>

      {/* Comentários */}
      <div className="mt-6 bg-surface-card rounded-xl p-6 border border-white/5">
        <h3 className="text-xs font-bold tracking-widest text-white/40 uppercase mb-4">COMENTÁRIOS</h3>
        {comments.length === 0 && <p className="text-white/20 text-sm text-center">Sem comentários ainda.</p>}
        {comments.map((c) => (
          <div key={c.id} className="flex gap-2 py-2 border-b border-white/5 last:border-0">
            <span className="text-base">{c.countries?.flag_emoji ?? '🌐'}</span>
            <div>
              <p className="text-white/60 text-xs font-semibold">{c.countries?.name}</p>
              <p className="text-white/80 text-sm mt-0.5">{c.content}</p>
            </div>
          </div>
        ))}

        {/* Input de comentário */}
        <div className="mt-4 flex gap-2">
          <input
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleComment()}
            placeholder="Comentar..."
            className="flex-1 input-field py-2 text-sm"
          />
          <button
            onClick={handleComment}
            disabled={sending || !reply.trim()}
            className="bg-primary text-white rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-30"
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  )
}