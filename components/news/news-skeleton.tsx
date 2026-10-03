import { Skeleton } from "@/components/ui";

export function NewsSkeleton() {
  return (
    <div aria-hidden className="mt-10">
      <div className="grid gap-6 lg:grid-cols-3 lg:gap-10">
        <Skeleton className="aspect-[16/9] rounded-2xl lg:col-span-2" />
        <div className="flex flex-col justify-center gap-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3">
            <Skeleton className="aspect-[4/3] rounded-xl" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
