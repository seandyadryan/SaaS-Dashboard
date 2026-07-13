import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import type { Chat, User } from "@/types";

export type DashboardSummary = {
  totalUsers: number;
  totalChats: number;
  totalMessages: number;
  totalPrompts: number;
  totalResponses: number;
};

const defaultSummary: DashboardSummary = {
  totalUsers: 0,
  totalChats: 0,
  totalMessages: 0,
  totalPrompts: 0,
  totalResponses: 0,
};

export function useDashboardData(fallbackUsers: User[], fallbackChats: Chat[]) {
  const [summary, setSummary] = useState<DashboardSummary>(defaultSummary);
  const [users, setUsers] = useState<User[]>(fallbackUsers);
  const [chats, setChats] = useState<Chat[]>(fallbackChats);
  const [source, setSource] = useState<"database" | "fallback">("fallback");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [summaryResponse, usersResponse, chatsResponse] = await Promise.all([
          apiClient.get<DashboardSummary>("/dashboard/summary"),
          apiClient.get<User[]>("/dashboard/users"),
          apiClient.get<Chat[]>("/dashboard/chats"),
        ]);

        if (cancelled) return;
        setSummary(summaryResponse.data);
        setUsers(usersResponse.data.length ? usersResponse.data : fallbackUsers);
        setChats(chatsResponse.data.length ? chatsResponse.data : fallbackChats);
        setSource("database");
      } catch {
        if (cancelled) return;
        setSummary({
          totalUsers: fallbackUsers.length,
          totalChats: fallbackChats.length,
          totalMessages: fallbackChats.length * 2,
          totalPrompts: fallbackChats.length,
          totalResponses: fallbackChats.length,
        });
        setUsers(fallbackUsers);
        setChats(fallbackChats);
        setSource("fallback");
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [fallbackChats, fallbackUsers, revision]);

  return { summary, users, chats, source, reload: () => setRevision((value) => value + 1) };
}
