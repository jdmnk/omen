"use client";

import { useRef, useState } from "react";
import { ChevronDown, ChevronUp, GripVertical, Pencil, Plus, Star } from "lucide-react";
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
import { toast } from "sonner";
import { useWatchlist, WatchlistItem } from "@/lib/hooks/use-watchlist";
import { cn } from "@/lib/utils";
import { MarketWatchlistImportExportDialog } from "./MarketWatchlistImportExportDialog";

const INITIAL_LIMIT = 10;
const CONFIRM_TIMEOUT_MS = 3000;

function SortableWatchlistItem({
  item,
  pendingUnwatch,
  onStarClick,
  isEditing,
  isEditingDescription,
  descriptionValue,
  onStartEditDescription,
  onChangeDescription,
  onSaveDescription,
  onCancelDescription,
}: {
  item: WatchlistItem;
  pendingUnwatch: boolean;
  onStarClick: (item: WatchlistItem) => void;
  isEditing: boolean;
  isEditingDescription: boolean;
  descriptionValue: string;
  onStartEditDescription: (item: WatchlistItem) => void;
  onChangeDescription: (value: string) => void;
  onSaveDescription: () => void;
  onCancelDescription: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.slug, disabled: !isEditing });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleStarClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onStarClick(item);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "inline-flex items-center gap-1.5 pl-1 pr-2 py-1 text-xs rounded-md",
        "border border-brand-stroke bg-card/80",
        "transition-colors",
        "hover:bg-brand-highlight/20",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isDragging && "opacity-50 z-50"
      )}
    >
      {isEditing && (
        <div
          {...attributes}
          {...listeners}
          className="shrink-0 cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical className="h-3 w-3 text-muted-foreground" />
        </div>
      )}
      <button
        onClick={handleStarClick}
        className={cn(
          "shrink-0 cursor-pointer transition-all duration-200",
          "hover:scale-110 active:scale-95",
          pendingUnwatch && "animate-pulse"
        )}
      >
        <Star
          className={cn(
            "h-3 w-3 transition-colors",
            pendingUnwatch
              ? "fill-yellow-400/50 text-yellow-400/50"
              : "fill-yellow-400 text-yellow-400"
          )}
        />
      </button>
      <Link href={`/market/${item.slug}`} className="font-medium hover:underline">
        {item.title || item.slug}
      </Link>
      {isEditingDescription ? (
        <input
          value={descriptionValue}
          onChange={(event) => onChangeDescription(event.target.value)}
          onBlur={onSaveDescription}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onSaveDescription();
            }
            if (event.key === "Escape") {
              onCancelDescription();
            }
          }}
          placeholder="Add note"
          className="h-6 rounded-md border border-brand-stroke bg-transparent px-2 text-[11px] text-foreground outline-none placeholder:text-muted-foreground"
          autoFocus
        />
      ) : item.description ? (
        <button
          type="button"
          onClick={() => onStartEditDescription(item)}
          className={cn(
            "text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer",
            !isEditing && "cursor-default"
          )}
          disabled={!isEditing}
        >
          {item.description}
        </button>
      ) : isEditing ? (
        <button
          type="button"
          onClick={() => onStartEditDescription(item)}
          className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <Plus className="h-3 w-3" />
        </button>
      ) : null}
    </div>
  );
}

export function MarketWatchlist() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingDescriptionId, setEditingDescriptionId] = useState<string | null>(null);
  const [editingDescriptionValue, setEditingDescriptionValue] = useState("");
  const [pendingUnwatch, setPendingUnwatch] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { watchlist, reorderWatchlist, removeFromWatchlist, updateDescription } =
    useWatchlist();

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
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Add markets with the star button, or import an existing watchlist.</span>
        <MarketWatchlistImportExportDialog />
      </div>
    );
  }

  const displayItems = isExpanded ? watchlist : watchlist.slice(0, INITIAL_LIMIT);
  const hasMore = watchlist.length > INITIAL_LIMIT;
  const remainingCount = watchlist.length - INITIAL_LIMIT;

  function handleDragEnd(event: DragEndEvent) {
    if (!isEditing) return;
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = watchlist.findIndex((item) => item.slug === active.id);
      const newIndex = watchlist.findIndex((item) => item.slug === over.id);
      reorderWatchlist(oldIndex, newIndex);
    }
  }

  function handleStarClick(item: WatchlistItem) {
    const displayName = item.title || item.slug;

    if (pendingUnwatch === item.slug) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      removeFromWatchlist(item.slug);
      setPendingUnwatch(null);
      toast.success(`Removed ${displayName} from watchlist`);
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setPendingUnwatch(item.slug);
      toast.warning(`Click again to remove ${displayName} from watchlist`, {
        duration: CONFIRM_TIMEOUT_MS,
      });
      timeoutRef.current = setTimeout(() => {
        setPendingUnwatch(null);
        timeoutRef.current = null;
      }, CONFIRM_TIMEOUT_MS);
    }
  }

  function handleStartEditDescription(item: WatchlistItem) {
    if (!isEditing) return;
    setEditingDescriptionId(item.slug);
    setEditingDescriptionValue(item.description || "");
  }

  function handleSaveDescription() {
    if (!editingDescriptionId) return;
    const nextValue = editingDescriptionValue.trim();
    updateDescription(editingDescriptionId, nextValue || undefined);
    setEditingDescriptionId(null);
    setEditingDescriptionValue("");
  }

  function handleCancelDescription() {
    setEditingDescriptionId(null);
    setEditingDescriptionValue("");
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col gap-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Market Watchlist
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SortableContext
            items={displayItems.map((item) => item.slug)}
            strategy={horizontalListSortingStrategy}
          >
            {displayItems.map((item) => (
              <SortableWatchlistItem
                key={item.slug}
                item={item}
                pendingUnwatch={pendingUnwatch === item.slug}
                onStarClick={handleStarClick}
                isEditing={isEditing}
                isEditingDescription={editingDescriptionId === item.slug}
                descriptionValue={editingDescriptionValue}
                onStartEditDescription={handleStartEditDescription}
                onChangeDescription={setEditingDescriptionValue}
                onSaveDescription={handleSaveDescription}
                onCancelDescription={handleCancelDescription}
              />
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
          <button
            type="button"
            onClick={() => {
              setIsEditing((prev) => !prev);
              setEditingDescriptionId(null);
              setEditingDescriptionValue("");
            }}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <Pencil className="h-3 w-3" />
            <span>{isEditing ? "Done" : "Edit"}</span>
          </button>
          {isEditing && <MarketWatchlistImportExportDialog />}
        </div>
      </div>
    </DndContext>
  );
}
