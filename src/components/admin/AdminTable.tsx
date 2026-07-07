'use client'

interface Column<T> {
  key: keyof T
  header: string
  render?: (value: T[keyof T], row: T) => React.ReactNode
}

interface AdminTableProps<T> {
  data: T[]
  columns: Column<T>[]
  title?: string
  loading?: boolean
}

export default function AdminTable<T extends Record<string, any>>({ 
  data, 
  columns, 
  title,
  loading 
}: AdminTableProps<T>) {
  if (loading) {
    return (
      <div className="bg-[#1a1a1a] rounded-xl p-6 border border-white/5">
        <div className="w-full h-8 bg-white/5 rounded animate-pulse mb-4" />
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="w-full h-6 bg-white/5 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#1a1a1a] rounded-xl border border-white/5 overflow-hidden">
      {title && (
        <div className="px-4 py-3 border-b border-white/5">
          <p className="text-white/40 text-xs font-bold tracking-widest uppercase">{title}</p>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr>
              {columns.map(col => (
                <th key={String(col.key)} className="text-left py-2 px-4 text-white/40 text-xs font-bold uppercase">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-8 text-center text-white/30 text-sm">
                  Nenhum dado encontrado
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr key={idx} className="hover:bg-white/5 transition-colors">
                  {columns.map(col => (
                    <td key={String(col.key)} className="py-2 px-4 text-white/70 text-sm">
                      {col.render 
                        ? col.render(row[col.key], row) 
                        : String(row[col.key] ?? '-')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}