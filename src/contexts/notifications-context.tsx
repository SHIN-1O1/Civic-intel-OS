"use client";

import * as React from "react";
import { collection, query, where, onSnapshot, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./auth-context";
import { Ticket, Department, CATEGORY_TO_DEPARTMENT } from "@/lib/types";

interface Notification {
    id: string;
    type: 'new_assignment' | 'sla_warning' | 'escalation';
    ticketId: string;
    ticketNumber: number;
    message: string;
    timestamp: Date;
    read: boolean;
}

interface NotificationsContextType {
    notifications: Notification[];
    unreadCount: number;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    clearNotifications: () => void;
}

const NotificationsContext = React.createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
    const [notifications, setNotifications] = React.useState<Notification[]>([]);
    const { currentDepartment, isDepartmentHQ, isSuperAdmin, user } = useAuth();

    // Track which tickets we've already seen to detect "new" ones
    const seenTicketIds = React.useRef<Set<string>>(new Set());
    const isInitialLoad = React.useRef(true);

    // Listen for tickets assigned to this department
    React.useEffect(() => {
        if (!user) {
            setNotifications([]);
            seenTicketIds.current.clear();
            isInitialLoad.current = true;
            return;
        }

        // Only department HQ users get assignment notifications
        if (!isDepartmentHQ || !currentDepartment) {
            return;
        }

        // Query for tickets assigned to this department, updated in last 24 hours
        const twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

        const ticketsQuery = query(
            collection(db, 'tickets'),
            where('assignedDepartment', '==', currentDepartment),
            where('updatedAt', '>=', Timestamp.fromDate(twentyFourHoursAgo)),
            orderBy('updatedAt', 'desc')
        );

        const unsubscribe = onSnapshot(ticketsQuery, (snapshot) => {
            const newNotifications: Notification[] = [];

            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added' || change.type === 'modified') {
                    const ticketData = change.doc.data();
                    const ticketId = change.doc.id;

                    // Skip if we've already seen this ticket (prevents duplicates on initial load)
                    if (isInitialLoad.current) {
                        seenTicketIds.current.add(ticketId);
                        return;
                    }

                    // Check if this is a genuinely new assignment
                    if (!seenTicketIds.current.has(ticketId)) {
                        seenTicketIds.current.add(ticketId);

                        // Enhanced notification with team and priority info
                        const teamInfo = ticketData.assignedTeam ? ` → ${ticketData.assignedTeam}` : '';
                        const priorityInfo = ticketData.priority === 'critical' || ticketData.priority === 'high'
                            ? ` [${ticketData.priority.toUpperCase()}]` : '';

                        newNotifications.push({
                            id: `${ticketId}-${Date.now()}`,
                            type: 'new_assignment',
                            ticketId,
                            ticketNumber: ticketData.ticketNumber || 0,
                            message: `New ticket assigned: ${ticketData.type || ticketData.category}${teamInfo}${priorityInfo}`,
                            timestamp: ticketData.updatedAt?.toDate() || new Date(),
                            read: false
                        });
                    }
                }
            });

            if (newNotifications.length > 0) {
                setNotifications(prev => [...newNotifications, ...prev].slice(0, 50)); // Keep max 50
            }

            isInitialLoad.current = false;
        }, (error) => {
            console.error('[Notifications] Error listening to tickets:', error);
        });

        return () => {
            unsubscribe();
        };
    }, [user, isDepartmentHQ, currentDepartment]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAsRead = React.useCallback((id: string) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
    }, []);

    const markAllAsRead = React.useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }, []);

    const clearNotifications = React.useCallback(() => {
        setNotifications([]);
    }, []);

    const value: NotificationsContextType = {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearNotifications
    };

    return (
        <NotificationsContext.Provider value={value}>
            {children}
        </NotificationsContext.Provider>
    );
}

export function useNotifications() {
    const context = React.useContext(NotificationsContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationsProvider');
    }
    return context;
}
