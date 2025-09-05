import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  hasNext: boolean;
  hasPrev: boolean;
  className?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  hasNext,
  hasPrev,
  className = '',
}: PaginationProps) {
  // 响应式状态管理
  const [isMobile, setIsMobile] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    // 检查是否为移动端
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    // 初始检查
    checkIsMobile();

    // 监听窗口大小变化
    window.addEventListener('resize', checkIsMobile);

    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  // 生成页码数组 - 响应式设计
  const generatePageNumbers = () => {
    const pages: (number | string)[] = [];
    // 移动端显示更少的页码，桌面端显示更多
    const maxVisiblePages = isMobile ? 3 : 7; // 移动端最多3个，桌面端最多7个

    if (totalPages <= maxVisiblePages) {
      // 如果总页数小于等于最大显示页数，显示所有页码
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (isMobile) {
        // 移动端简化逻辑：根据情况显示页码
        if (totalPages <= 5) {
          // 如果总页数不多，显示所有页码
          for (let i = 1; i <= totalPages; i++) {
            pages.push(i);
          }
        } else {
          // 总页数较多时，只显示关键页码
          if (currentPage <= 2) {
            pages.push(1, 2, 3, '...');
          } else if (currentPage >= totalPages - 1) {
            pages.push('...', totalPages - 2, totalPages - 1, totalPages);
          } else {
            pages.push('...', currentPage, '...');
          }
        }
      } else {
        // 桌面端复杂逻辑
        if (currentPage <= 4) {
          // 当前页在前面
          for (let i = 1; i <= 5; i++) {
            pages.push(i);
          }
          pages.push('...');
          pages.push(totalPages);
        } else if (currentPage >= totalPages - 3) {
          // 当前页在后面
          pages.push(1);
          pages.push('...');
          for (let i = totalPages - 4; i <= totalPages; i++) {
            pages.push(i);
          }
        } else {
          // 当前页在中间
          pages.push(1);
          pages.push('...');
          for (let i = currentPage - 1; i <= currentPage + 1; i++) {
            pages.push(i);
          }
          pages.push('...');
          pages.push(totalPages);
        }
      }
    }

    return pages;
  };

  const pageNumbers = generatePageNumbers();

  // 处理页码输入
  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const page = parseInt(inputValue);
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
    setInputValue('');
    setShowInput(false);
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div
      className={`flex items-center justify-center gap-1 sm:gap-2 px-2 ${className}`}
    >
      {/* 上一页按钮 */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!hasPrev}
        className={`
          flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg text-sm font-medium transition-colors
          ${
            hasPrev
              ? 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'
              : 'bg-gray-50 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
          }
        `}
        aria-label='上一页'
      >
        <ChevronLeft className='w-4 h-4 sm:w-5 sm:h-5' />
      </button>

      {/* 页码 */}
      <div className='flex items-center gap-0.5 sm:gap-1'>
        {pageNumbers.map((page, index) => (
          <div key={index}>
            {page === '...' ? (
              <span className='flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 text-xs sm:text-sm text-gray-500 dark:text-gray-400'>
                ...
              </span>
            ) : (
              <button
                onClick={() => onPageChange(page as number)}
                className={`
                  flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg text-xs sm:text-sm font-medium transition-colors
                  ${
                    page === currentPage
                      ? 'bg-green-500 text-white shadow-sm'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'
                  }
                `}
              >
                {page}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* 下一页按钮 */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasNext}
        className={`
          flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg text-sm font-medium transition-colors
          ${
            hasNext
              ? 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'
              : 'bg-gray-50 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
          }
        `}
        aria-label='下一页'
      >
        <ChevronRight className='w-4 h-4 sm:w-5 sm:h-5' />
      </button>

      {/* 快速跳转 - 仅在页数较多时显示 */}
      {totalPages > 10 && (
        <div className='ml-2 sm:ml-4 flex items-center gap-2'>
          {!showInput ? (
            <button
              onClick={() => setShowInput(true)}
              className='text-xs sm:text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            >
              跳转
            </button>
          ) : (
            <form
              onSubmit={handleInputSubmit}
              className='flex items-center gap-1'
            >
              <input
                type='number'
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder='页码'
                min={1}
                max={totalPages}
                className='w-12 sm:w-16 h-6 sm:h-8 px-1 sm:px-2 text-xs sm:text-sm border border-gray-300 rounded focus:outline-none focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'
                autoFocus
              />
              <button
                type='submit'
                className='text-xs sm:text-sm text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300'
              >
                确定
              </button>
              <button
                type='button'
                onClick={() => {
                  setShowInput(false);
                  setInputValue('');
                }}
                className='text-xs sm:text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              >
                取消
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
