import NoticeCard from './NoticeCard';

export default function NoticeBoard({ items, sectionKey }) {
  return (
    <div className="board">
      {items.map((item) => (
        <NoticeCard key={item.slug} item={item} sectionKey={sectionKey} />
      ))}
    </div>
  );
}
