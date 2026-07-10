import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Download, Eye } from "lucide-react";
import { DataTable } from "@/components/data-table/data-table";
import { Page } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
import { chats } from "@/lib/mock-data";
import { downloadCsv } from "@/lib/utils";
import type { Chat } from "@/types";

export function ChatHistoryPage() {
  const [chat, setChat] = useState<Chat | null>(null);
  const columns: ColumnDef<Chat>[] = [
    { header: "User", accessorKey: "user" },
    { header: "Prompt", accessorKey: "prompt" },
    { header: "Response", accessorKey: "response" },
    { header: "Model", accessorKey: "model" },
    { header: "Time", accessorKey: "time" },
    { header: "Status", accessorKey: "status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    {
      header: "Action",
      cell: ({ row }) => (
        <Button variant="ghost" size="icon" onClick={() => setChat(row.original)} aria-label="View conversation">
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <Page
      title="Chat History"
      description="Search, filter, export, and inspect every AI conversation across models and customers."
      actions={
        <Button onClick={() => downloadCsv("neurax-chat-history.csv", chats)}>
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      }
    >
      <DataTable
        data={chats}
        columns={columns}
        searchPlaceholder="Search prompts, responses, users..."
        filter={
          <div className="flex gap-2">
            <Button variant="outline" size="sm">All Models</Button>
            <Button variant="outline" size="sm">Success</Button>
            <Button variant="outline" size="sm">Failed</Button>
          </div>
        }
      />
      <Modal open={Boolean(chat)} onOpenChange={(open) => !open && setChat(null)} title="Conversation" description={chat?.model}>
        {chat ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Prompt</p>
              <p className="mt-2 text-sm text-white">{chat.prompt}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Response</p>
              <p className="mt-2 text-sm text-white">{chat.response}</p>
            </div>
          </div>
        ) : null}
      </Modal>
    </Page>
  );
}
