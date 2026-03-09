import { isToday, isTomorrow, isYesterday, format } from "date-fns";

const getLabel = (date: Date): { label: string; sub: string } => {
  if (isToday(date)) return { label: "Today", sub: format(date, "MMMM d, yyyy") };
  if (isTomorrow(date)) return { label: "Tomorrow", sub: format(date, "MMMM d, yyyy") };
  if (isYesterday(date)) return { label: "Yesterday", sub: format(date, "MMMM d, yyyy") };
  return { label: format(date, "MMMM d"), sub: format(date, "EEEE") };
};

export const DateSeparator = ({ date }: { date: Date }) => {
  const { label, sub } = getLabel(date);

  return (
    <div className="sticky top-[88px] max-sm:top-[80px] z-10 text-center max-sm:text-left max-sm:pl-[52px] py-3 bg-newsprint before:content-[''] before:absolute before:left-[20px] before:top-0 before:bottom-0 before:w-1.5 before:bg-newsprint before:-translate-x-1/2 before:-z-10 sm:before:left-1/2">
      <div className="inline-block bg-newsprint px-5 py-1.5 border-2 border-rule">
        <h3 className="font-serif text-lg font-bold tracking-[0.06em] uppercase leading-none">
          {label}
        </h3>
        <small className="block font-mono text-[0.6rem] tracking-[0.12em] uppercase text-muted mt-0.5">
          {sub}
        </small>
      </div>
    </div>
  );
};
