import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

function Dialog({ children, description, onOpenChange, open, title }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    const dialog = dialogRef.current

    if (!dialog) {
      return
    }

    if (open && !dialog.open) {
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  return (
    <dialog
      aria-describedby={description ? 'finance-dialog-description' : undefined}
      aria-labelledby="finance-dialog-title"
      className="finance-dialog"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onOpenChange(false)
        }
      }}
      onClose={() => onOpenChange(false)}
      ref={dialogRef}
    >
      <div className="finance-dialog-content">
        <header className="finance-dialog-header">
          <div>
            <h2 id="finance-dialog-title">{title}</h2>
            {description && (
              <p id="finance-dialog-description">{description}</p>
            )}
          </div>
          <button
            aria-label="Zatvori prozor"
            className="finance-dialog-close"
            onClick={() => onOpenChange(false)}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </header>
        {children}
      </div>
    </dialog>
  )
}

export default Dialog
