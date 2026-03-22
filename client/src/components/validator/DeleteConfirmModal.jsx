import { Card } from '../ui/Card'
import { Button } from '../ui/Button'

export function DeleteConfirmModal({ isOpen, isDeleting, onConfirm, onCancel }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/20 z-50">
      <Card decoration="tack" className="w-full max-w-sm p-8">
        <h3 className="font-heading text-2xl text-pencil mb-4">Delete Result?</h3>
        <p className="font-body text-pencil/70 mb-8">This cannot be undone.</p>
        <div className="flex gap-4 justify-center">
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button variant="primary" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
