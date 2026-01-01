"use client";

import { useState, useRef } from "react";
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  Pencil,
  Plus,
  Star,
} from "lucide-react";
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
import {
  useUserWatchlist,
  UserWatchlistItem,
} from "@/lib/hooks/use-user-watchlist";
import { cn } from "@/lib/utils";
import { formatAddress } from "@/lib/ui/format.utils";
import { UserWatchlistActivityFeed } from "./UserWatchlistActivityFeed";
import { UserWatchlistImportExportDialog } from "./UserWatchlistImportExportDialog";

const INITIAL_LIMIT = 10;
const CONFIRM_TIMEOUT_MS = 3000;

function SortableWatchlistItem({
  user,
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
  user: UserWatchlistItem;
  pendingUnwatch: boolean;
  onStarClick: (user: UserWatchlistItem) => void;
  isEditing: boolean;
  isEditingDescription: boolean;
  descriptionValue: string;
  onStartEditDescription: (user: UserWatchlistItem) => void;
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
  } = useSortable({ id: user.proxyWallet, disabled: !isEditing });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleStarClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onStarClick(user);
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
      <Link
        href={`/user/${user.proxyWallet}`}
        className="font-medium hover:underline"
      >
        {user.name || formatAddress(user.proxyWallet)}
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
      ) : user.description ? (
        <button
          type="button"
          onClick={() => onStartEditDescription(user)}
          className={cn(
            "text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer",
            !isEditing && "cursor-default"
          )}
          disabled={!isEditing}
        >
          {user.description}
        </button>
      ) : isEditing ? (
        <button
          type="button"
          onClick={() => onStartEditDescription(user)}
          className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <Plus className="h-3 w-3" />
        </button>
      ) : null}
    </div>
  );
}

export function UserWatchlist() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingDescriptionId, setEditingDescriptionId] = useState<
    string | null
  >(null);
  const [editingDescriptionValue, setEditingDescriptionValue] = useState("");
  const [pendingUnwatch, setPendingUnwatch] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { watchlist, reorderWatchlist, removeFromWatchlist, updateDescription } =
    useUserWatchlist();

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
        <span>Add users with the star button, or import an existing watchlist.</span>
        <UserWatchlistImportExportDialog />
      </div>
    );
  }

  const displayItems = isExpanded
    ? watchlist
    : watchlist.slice(0, INITIAL_LIMIT);
  const hasMore = watchlist.length > INITIAL_LIMIT;
  const remainingCount = watchlist.length - INITIAL_LIMIT;

  function handleDragEnd(event: DragEndEvent) {
    if (!isEditing) return;
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

  function handleStarClick(user: UserWatchlistItem) {
    const displayName = user.name || formatAddress(user.proxyWallet);

    if (pendingUnwatch === user.proxyWallet) {
      // Second click - confirm unwatchlist
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      removeFromWatchlist(user.proxyWallet);
      setPendingUnwatch(null);
      toast.success(`Removed ${displayName} from watchlist`);
    } else {
      // First click - show warning
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setPendingUnwatch(user.proxyWallet);
      toast.warning(`Click again to remove ${displayName} from watchlist`, {
        duration: CONFIRM_TIMEOUT_MS,
      });
      timeoutRef.current = setTimeout(() => {
        setPendingUnwatch(null);
        timeoutRef.current = null;
      }, CONFIRM_TIMEOUT_MS);
    }
  }

  function handleStartEditDescription(user: UserWatchlistItem) {
    if (!isEditing) return;
    setEditingDescriptionId(user.proxyWallet);
    setEditingDescriptionValue(user.description || "");
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
        <div className="flex flex-wrap items-center gap-2">
          <SortableContext
            items={displayItems.map((item) => item.proxyWallet)}
            strategy={horizontalListSortingStrategy}
          >
            {displayItems.map((user) => (
              <SortableWatchlistItem
                key={user.proxyWallet}
                user={user}
                pendingUnwatch={pendingUnwatch === user.proxyWallet}
                onStarClick={handleStarClick}
                isEditing={isEditing}
                isEditingDescription={editingDescriptionId === user.proxyWallet}
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
          {isEditing && <UserWatchlistImportExportDialog />}
          <button
            onClick={() => setIsActivityOpen((open) => !open)}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            {isActivityOpen ? (
              <>
                <span>Hide activity</span>
                <ChevronUp className="h-3 w-3" />
              </>
            ) : (
              <>
                <span>Watchlist activity</span>
                <ChevronDown className="h-3 w-3" />
              </>
            )}
          </button>
        </div>
        {isActivityOpen && (
          <div className="w-full rounded-lg border border-brand-stroke bg-background/50 overflow-hidden">
            <div className="px-3 pt-3 pb-2 border-b border-brand-stroke">
              <h3 className="text-sm font-bold uppercase text-brand-primary pb-[3px]">
                Watchlist Activity
              </h3>
            </div>
            <div className="h-[420px]">
              <UserWatchlistActivityFeed watchlist={watchlist} />
            </div>
          </div>
        )}
      </div>
    </DndContext>
  );
}
