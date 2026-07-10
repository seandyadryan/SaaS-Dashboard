import { useEffect, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Download, Eye, File, FileAudio, FileImage, FileText, FileVideo, Folder, HardDrive, RefreshCw } from "lucide-react";
import { DataTable } from "@/components/data-table/data-table";
import { Page } from "@/components/layout/page";
import { StatCard } from "@/components/layout/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { storageFiles } from "@/lib/mock-data";
import { apiClient } from "@/lib/api";
import { useUiStore } from "@/store/ui-store";
import type { StorageFile } from "@/types";

type StorageSummary = {
  total: string;
  used: string;
  remaining: string;
  usagePercent: number;
};

const fallbackSummary: StorageSummary = {
  total: "12 TB",
  used: "7.1 TB",
  remaining: "4.9 TB",
  usagePercent: 59,
};

const fileIcons = {
  folder: Folder,
  image: FileImage,
  video: FileVideo,
  audio: FileAudio,
  pdf: FileText,
  text: FileText,
  file: File,
};

export function StoragePage() {
  const { addToast } = useUiStore();
  const [summary, setSummary] = useState<StorageSummary>(fallbackSummary);
  const [files, setFiles] = useState<StorageFile[]>(storageFiles);
  const [selectedFile, setSelectedFile] = useState<StorageFile | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const loadStorage = async () => {
    try {
      const [summaryResponse, filesResponse] = await Promise.all([
        apiClient.get<StorageSummary>("/dashboard/storage/summary"),
        apiClient.get<StorageFile[]>("/dashboard/storage/files"),
      ]);
      setSummary(summaryResponse.data);
      setFiles(filesResponse.data.length ? filesResponse.data : storageFiles);
    } catch {
      setSummary(fallbackSummary);
      setFiles(storageFiles);
      addToast({
        title: "Storage fallback aktif",
        description: "Data server belum tersedia, menampilkan contoh file.",
        variant: "warning",
      });
    }
  };

  useEffect(() => {
    void loadStorage();
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const openPreview = async (file: StorageFile) => {
    if (file.kind === "folder") {
      addToast({ title: "Folder tersedia", description: file.path ?? file.name, variant: "default" });
      return;
    }

    if (!file.path) {
      addToast({ title: "Preview tidak tersedia", description: file.name, variant: "warning" });
      return;
    }

    setSelectedFile(file);
    setPreviewLoading(true);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);

    try {
      const response = await apiClient.get(`/dashboard/storage/file`, {
        params: { path: file.path },
        responseType: "blob",
      });
      setPreviewUrl(URL.createObjectURL(response.data));
    } catch {
      addToast({ title: "Gagal membuka file", description: file.name, variant: "danger" });
      setSelectedFile(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const downloadFile = async (file: StorageFile) => {
    if (file.kind === "folder") {
      addToast({ title: "Folder tidak dapat di-download", description: file.path ?? file.name, variant: "warning" });
      return;
    }

    if (!file.path) {
      addToast({ title: "Download tidak tersedia", description: file.name, variant: "warning" });
      return;
    }

    const response = await apiClient.get(`/dashboard/storage/file`, {
      params: { path: file.path, download: "1" },
      responseType: "blob",
    });
    const url = URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    link.click();
    URL.revokeObjectURL(url);
  };

  const columns: ColumnDef<StorageFile>[] = [
    {
      header: "File List",
      cell: ({ row }) => {
        const Icon = fileIcons[row.original.kind ?? "file"];
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-500/12 text-blue-200">
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium text-white">{row.original.name}</p>
              {row.original.path ? <p className="truncate text-xs text-slate-500">{row.original.path}</p> : null}
            </div>
          </div>
        );
      },
    },
    { header: "Type", accessorKey: "type", cell: ({ row }) => <Badge>{row.original.type}</Badge> },
    { header: "Size", accessorKey: "size" },
    { header: "Owner", accessorKey: "owner" },
    { header: "Updated", accessorKey: "updatedAt", cell: ({ row }) => new Date(row.original.updatedAt).toLocaleString() },
    {
      header: "Action",
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => void openPreview(row.original)} aria-label="Preview">
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => void downloadFile(row.original)} aria-label="Download">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Page
      title="Storage"
      description="File management untuk membuka foto, video, audio, PDF, text, dan file server lainnya dengan ukuran storage real dari server."
      actions={
        <Button onClick={() => void loadStorage()}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total Storage" value={summary.total} change="Server filesystem" icon={HardDrive} />
        <StatCard label="Used" value={summary.used} change={`${summary.usagePercent}% usage`} icon={HardDrive} trend="down" />
        <StatCard label="Remaining" value={summary.remaining} change="Available on server" icon={HardDrive} />
      </div>
      <DataTable data={files} columns={columns} searchPlaceholder="Search files..." />

      <Modal
        open={Boolean(selectedFile)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedFile(null);
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
          }
        }}
        title={selectedFile?.name ?? "File Preview"}
        description={selectedFile?.path}
      >
        <div className="min-h-[280px] overflow-hidden rounded-xl border border-slate-800 bg-slate-950/50">
          {previewLoading ? (
            <div className="flex h-72 items-center justify-center text-sm text-slate-400">Loading preview...</div>
          ) : previewUrl && selectedFile?.kind === "image" ? (
            <img src={previewUrl} alt={selectedFile.name} className="max-h-[70vh] w-full object-contain" />
          ) : previewUrl && selectedFile?.kind === "video" ? (
            <video src={previewUrl} controls className="max-h-[70vh] w-full bg-black" />
          ) : previewUrl && selectedFile?.kind === "audio" ? (
            <div className="flex h-72 items-center justify-center p-6">
              <audio src={previewUrl} controls className="w-full" />
            </div>
          ) : previewUrl && selectedFile?.kind === "pdf" ? (
            <iframe src={previewUrl} title={selectedFile.name} className="h-[70vh] w-full" />
          ) : previewUrl && selectedFile?.kind === "text" ? (
            <iframe src={previewUrl} title={selectedFile.name} className="h-[70vh] w-full bg-white" />
          ) : (
            <div className="flex h-72 flex-col items-center justify-center gap-3 text-center text-sm text-slate-400">
              <File className="h-10 w-10 text-slate-500" />
              <p>Preview tidak tersedia untuk tipe file ini.</p>
              {selectedFile ? (
                <Button onClick={() => void downloadFile(selectedFile)}>
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </Modal>
    </Page>
  );
}
