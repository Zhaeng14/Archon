import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { X, Send, Copy, Loader } from 'lucide-react';

interface BugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: any;
}

export const BugReportModal: React.FC<BugReportModalProps> = ({ isOpen, onClose, context }) => {
  const [title, setTitle] = useState(`Bug: ${context?.error?.name ?? ''}`.trim());
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const copyContext = async () => {
    try {
      const payload = {
        title,
        description,
        stepsToReproduce: steps,
        context
      };
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    } catch {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await copyContext();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <Card className="w-full max-w-2xl p-6 relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-foreground/60 hover:text-foreground" aria-label="Close">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-semibold mb-4">Report a Bug</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Title" value={title} onChange={e => setTitle(e.target.value)} />
          <div>
            <label className="block text-sm text-foreground/80 mb-1">Description</label>
            <textarea
              className="w-full rounded-md border border-input bg-card text-card-foreground p-3 resize-y min-h-[96px]"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What happened?"
            />
          </div>
          <div>
            <label className="block text-sm text-foreground/80 mb-1">Steps to Reproduce</label>
            <textarea
              className="w-full rounded-md border border-input bg-card text-card-foreground p-3 resize-y min-h-[96px]"
              value={steps}
              onChange={e => setSteps(e.target.value)}
              placeholder={'1. Go to ...\n2. Click ...\n3. See error ...'}
            />
          </div>

          <div className="text-xs bg-muted/60 rounded p-3 border border-border">
            <div><strong>Version:</strong> {context?.app?.version ?? 'n/a'}</div>
            <div><strong>Platform:</strong> {context?.system?.platform ?? 'n/a'}</div>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="ghost" onClick={copyContext} icon={<Copy className="w-4 h-4" />}>Copy</Button>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={submitting} icon={submitting ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" /> }>
              {submitting ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

