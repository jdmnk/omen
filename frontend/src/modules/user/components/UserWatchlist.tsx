"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, GripVertical, Star } from "lucide-react";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  useUserWatchlist,
  UserWatchlistItem,
} from "@/lib/hooks/use-user-watchlist";
import { cn } from "@/lib/utils";
import { formatAddress } from "@/lib/ui/format.utils";

const INITIAL_LIMIT = 10;

function SortableWatchlistItem({ user }: { user: UserWatchlistItem }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: user.proxyWallet });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "inline-flex items-center gap-1.5 pl-1 pr-2 py-1 text-xs rounded-md",
        "border border-brand-stroke",
        "transition-colors",
        "hover:bg-brand-highlight/20",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isDragging && "opacity-50 z-50"
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="shrink-0 cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical className="h-3 w-3 text-muted-foreground" />
      </div>
      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 shrink-0" />
      <Link
        href={`/user/${user.proxyWallet}`}
        className="font-medium hover:underline"
      >
        {user.name || formatAddress(user.proxyWallet)}
      </Link>
    </div>
  );
}

export function UserWatchlist() {
  const [isExpanded, setIsExpanded] = useState(true);
  const { watchlist, reorderWatchlist } = useUserWatchlist();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (watchlist.length === 0) {
    return null;
  }

  const displayItems = isExpanded
    ? watchlist
    : watchlist.slice(0, INITIAL_LIMIT);
  const hasMore = watchlist.length > INITIAL_LIMIT;
  const remainingCount = watchlist.length - INITIAL_LIMIT;

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = watchlist.findIndex(
        (item) => item.proxyWallet === active.id
      );
      const newIndex = watchlist.findIndex(
        (item) => item.proxyWallet === over.id
      );
      reorderWatchlist(oldIndex, newIndex);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-wrap items-center gap-2">
        <SortableContext
          items={displayItems.map((item) => item.proxyWallet)}
          strategy={horizontalListSortingStrategy}
        >
          {displayItems.map((user) => (
            <SortableWatchlistItem key={user.proxyWallet} user={user} />
          ))}
        </SortableContext>
        {hasMore && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            {isExpanded ? (
              <>
                <span>Show less</span>
                <ChevronUp className="h-3 w-3" />
              </>
            ) : (
              <>
                <span>+{remainingCount} more</span>
                <ChevronDown className="h-3 w-3" />
              </>
            )}
          </button>
        )}
      </div>
    </DndContext>
  );
}
