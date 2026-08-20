import Modal from "@/components/Modal";

interface GeneratingModalProps {
  open: boolean;
}

export default function GeneratingModal({ open }: GeneratingModalProps) {
  return (
    <Modal open={open}>
      <div className="flex items-center gap-3">
        <div className="size-6 animate-spin rounded-full border-2 border-neutral-600 border-t-foreground" />
        <p className="noto-sans text-sm text-neutral-200">生成中...</p>
      </div>
    </Modal>
  );
}
