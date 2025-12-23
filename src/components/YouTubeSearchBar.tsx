'use client';

import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const YouTubeSearchBar = () => {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className='w-full'>
      <div className='flex'>
        <div className='flex-1 relative'>
          <input
            type='text'
            placeholder='搜索影片...'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className='w-full h-8 px-4 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-l-full text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none'
          />
        </div>
        <button
          type='submit'
          className='px-3 bg-gray-200 dark:bg-gray-800 border border-l-0 border-gray-300 dark:border-gray-700 rounded-r-full hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors flex items-center justify-center'
        >
          <Search size={16} className='text-gray-600 dark:text-gray-400' />
        </button>
      </div>
    </form>
  );
};

export default YouTubeSearchBar;
