import type { ColumnDef } from "@tanstack/react-table";
import { Download, Eye, HardDrive, Trash2, Upload } from "lucide-react";
import { DataTable } from "@/components/data-table/data-table";
import { Page } from "@/components/layout/page";
import { StatCard } from "@/components/layout/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { storageFiles } from "@/lib/mock-data";
import { useUiStore } from "@/store/ui-store";
import type { StorageFile } from "@/types";

export function StoragePage() {
  const { addToast } = useUiStore();
  const columns: ColumnDef<StorageFile>[] = [
    { header: "File List", accessorKey: "name" },
    { header: "Type", accessorKey: "type", cell: ({ row }) => <Badge>{row.original.type}</Badge> },
    { header: "Size", accessorKey: "size" },
    { header: "Owner", accessorKey: "owner" },
    { header: "Updated", accessorKey: "updatedAt" },
    {
      header: "Action",
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => addToast({ title: "Preview opened", description: row.original.name })} aria-label="Preview">
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => addToast({ title: "Download started", description: row.original.name, variant: "success" })} aria-label="Download">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="danger" size="icon" onClick={() => addToast({ title: "Delete requested", description: row.original.name, variant: "danger" })} aria-label="Delete">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Page
      title="Storage"
      description="Inspect total storage, used space, remaining capacity, file search, preview, delete, and download actions."
      actions={
        <Button>
          <Upload className="h-4 w-4" />
          Upload
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total Storage" value="12 TB" change="Oracle object storage" icon={HardDrive} />
        <StatCard label="Used" value="7.1 TB" change="59% usage" icon={HardDrive} trend="down" />
        <StatCard label="Remaining" value="4.9 TB" change="+2.3 TB reserved" icon={HardDrive} />
      </div>
      <DataTable data={storageFiles} columns={columns} searchPlaceholder="Search files..." />
    </Page>
  );
}
