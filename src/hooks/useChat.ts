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
  reply_to_id?: string | null
  reply_to_message?: {
    content: string
    country: { name: string; flag_emoji: string } | null
  } | null
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
        reply_to_id,
        reply_to_message:reply_to_id (
          content,
          countries ( name, flag_emoji )
        ),
        countries ( name, flag_emoji )
      `)
      .order('created_at', { ascending: true })
      .limit(100)

    if (data) {
      setMessages(data.map((m: any) => ({
        ...m,
        media_url: m.image_url || m.video_url || m.gif_url || m.sticker_url || m.file_url || m.music_url || null,
        country: m.countries,
        reply_to_message: m.reply_to_message,
      })))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchMessages()

    const channel = supabase
      .channel('chat_messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        async (payload) => {
          const { data } = await supabase
            .from('countries')
            .select('name, flag_emoji')
            .eq('id', payload.new.country_id)
            .single()

          // Buscar a mensagem original se houver reply_to_id
          let replyData = null
          if (payload.new.reply_to_id) {
            const { data: reply } = await supabase
              .from('chat_messages')
              .select('content, countries ( name, flag_emoji )')
              .eq('id', payload.new.reply_to_id)
              .single()
            replyData = reply
          }

          setMessages(prev => [...prev, {
            ...payload.new as any,
            media_url: payload.new.image_url || payload.new.video_url || payload.new.gif_url || payload.new.sticker_url || payload.new.file_url || payload.new.music_url || null,
            country: data ?? { name: 'Desconhecido', flag_emoji: '🌐' },
            reply_to_message: replyData
          }])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchMessages])

  async function sendMessage(content: string, file?: File, reply_to_id?: string | null) {
    if (!country?.id) return
    if (!content.trim() && !file) return

    let insertData: any = { 
      country_id: country.id, 
      content: content.trim() || null,
      reply_to_id: reply_to_id || null
    }

    if (file) {
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
        mediaType = 'file'
        columnName = 'file_url'
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `chat_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `chat/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file, { cacheControl: '3600', upsert: false })

      if (uploadError) {
        console.error('Erro ao enviar arquivo:', uploadError.message)
        return
      }

      const { data: urlData } = supabase.storage
        .from('media')
        .getPublicUrl(filePath)

      insertData[columnName] = urlData.publicUrl
      insertData.media_type = mediaType
    }

    await supabase.from('chat_messages').insert(insertData)
  }

  return { messages, loading, sendMessage }
}
