interface DateSeparatorProps {
  date: string;
}

export function DateSeparator({ date }: DateSeparatorProps) {
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const isToday = date.toDateString() === today.toDateString();
      const isYesterday = date.toDateString() === yesterday.toDateString();

      if (isToday) return 'Hoje';
      if (isYesterday) return 'Ontem';

      return date.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex items-center justify-center my-4">
      <div className="bg-white/90 px-3 py-1 rounded-lg shadow-sm">
        <span className="text-[13px] text-gray-600">
          {formatDate(date)}
        </span>
      </div>
    </div>
  );
}
