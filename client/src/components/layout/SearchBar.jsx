import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { Search } from 'lucide-react'
import { setSearchTerm } from '../../store/slices/historySlice'

export function SearchBar({ isVisible }) {
  const dispatch = useDispatch()

  const handleChange = useCallback((e) => {
    dispatch(setSearchTerm(e.target.value))
  }, [dispatch])

  if (!isVisible) return null

  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
        <Search size={18} className="text-pencil opacity-60" strokeWidth={2.5} />
      </div>
      <input
        type="text"
        placeholder="Search by title or idea..."
        onChange={handleChange}
        className="w-full pl-9 pr-3 py-2 font-body text-base text-pencil bg-paper border-2 border-pencil focus:border-blue focus:ring-2 focus:ring-blue/20 outline-none"
        style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
      />
    </div>
  )
}
