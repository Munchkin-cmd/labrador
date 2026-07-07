import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'

export interface ChatMessage {
  id: string
  country_id: number
  content: string
  media_url?: string | null
  media_type?: string | null
  created_at: string
  country: {
    name: string
    flag_emoji: string
  }
}

export function useChat() {
  const { country } = useAuthStore()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMessages = useCallback(async () => {
    const { data } = await supabase
      .from('chat_messages')
      .select(`
        id, 
        country_id, 
        content, 
        image_url, 
        video_url, 
        gif_url, 
        sticker_url, 
        file_url, 
        music_url,
        media_type, 
        created_at,
        countries ( name, flag_emoji )
      `)
      .order('created_at', { ascending: true })
      .limit(100)

    if (data) {
      setMessages(data.map((m: any) => ({
        ...m,
        // Determina a URL da mídia com base em qual coluna está preenchida
        media_url: m.image_url || m.video_url || m.gif_url || m.sticker_url || m.file_url || m.music_url || null,
        country: m.countries,
      })))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchMessages()

    // Realtime subscription
    const channel = supabase
      .channel('chat_messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        async (payload) => {
          // Busca o nome e bandeira do país que enviou
          const { data } = await supabase
            .from('countries')
            .select('name, flag_emoji')
            .eq('id', payload.new.country_id)
            .single()

          setMessages(prev => [...prev, {
            ...payload.new as any,
            media_url: payload.new.image_url || payload.new.video_url || payload.new.gif_url || payload.new.sticker_url || payload.new.file_url || payload.new.music_url || null,
            country: data ?? { name: 'Desconhecido', flag_emoji: '🌐' },
          }])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchMessages])

  /**
   * Envia uma mensagem com texto e/ou arquivo
   * @param content Texto da mensagem
   * @param file Arquivo opcional (imagem, vídeo, gif, sticker, áudio, documento)
   */
  async function sendMessage(content: string, file?: File) {
    if (!country?.id) return
    if (!content.trim() && !file) return

    let insertData: any = { 
      country_id: country.id, 
      content: content.trim() || null
    }

    // ✅ Se houver um arquivo, faz o upload e determina a coluna
    if (file) {
      // 1. Determina o tipo de mídia
      let mediaType: string
      let columnName: string

      if (file.type.startsWith('image/')) {
        mediaType = 'image'
        columnName = 'image_url'
      } else if (file.type.startsWith('video/')) {
        mediaType = 'video'
        columnName = 'video_url'
      } else if (file.type === 'image/gif') {
        mediaType = 'gif'
        columnName = 'gif_url'
      } else if (file.type.startsWith('audio/')) {
        mediaType = 'audio'
        columnName = 'music_url'
      } else {
        // Qualquer outro arquivo (PDF, ZIP, etc.)
        mediaType = 'file'
        columnName = 'file_url'
      }

      // 2. Gera um nome único para o arquivo no bucket
      const fileExt = file.name.split('.').pop()
      const fileName = `chat_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `chat/${fileName}`

      // 3. Faz o upload para o bucket 'media'
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Erro ao enviar arquivo para o Storage:', uploadError.message)
        return
      }

      // 4. Pega a URL pública
      const { data: urlData } = supabase.storage
        .from('media')
        .getPublicUrl(filePath)

      // 5. Adiciona a URL e o tipo ao objeto de insert
      insertData[columnName] = urlData.publicUrl
      insertData.media_type = mediaType
    }

    // 6. Insere no banco
    await supabase.from('chat_messages').insert(insertData)
  }

  return { messages, loading, sendMessage }
}
