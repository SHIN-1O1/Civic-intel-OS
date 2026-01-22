"use client";

import * as React from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/contexts/notifications-context";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";

export function NotificationBell() {
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const [open, setOpen] = React.useState(false);

    const handleNotificationClick = (id: string) => {
        markAsRead(id);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground font-semibold">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <h4 className="font-semibold text-sm">Notifications</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-auto py-1 px-2"
                            onClick={markAllAsRead}
                        >
                            Mark all read
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                            <Bell className="h-8 w-8 mb-2 opacity-50" />
                            <p className="text-sm">No notifications</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {notifications.map((notification) => (
                                <Link
                                    key={notification.id}
                                    href={`/tickets/${notification.ticketId}`}
                                    onClick={() => {
                                        handleNotificationClick(notification.id);
                                        setOpen(false);
                                    }}
                                    className={cn(
                                        "block px-4 py-3 hover:bg-muted/50 transition-colors",
                                        !notification.read && "bg-primary/5"
                                    )}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={cn(
                                            "h-2 w-2 mt-2 rounded-full flex-shrink-0",
                                            notification.read ? "bg-muted" : "bg-primary"
                                        )} />
                                        <div className="flex-1 min-w-0">
                                            <p className={cn(
                                                "text-sm truncate",
                                                !notification.read && "font-medium"
                                            )}>
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                Ticket #{notification.ticketNumber} • {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
