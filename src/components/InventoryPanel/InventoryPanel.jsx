import { useState } from 'react'
import './InventoryPanel.css'

export default function InventoryPanel({ isOpen, inventory, onClose }) {
  const [selectedItem, setSelectedItem] = useState(null)

  const handleItemClick = (item) => {
    setSelectedItem(selectedItem?.id === item.id ? null : item)
  }

  return (
    <div className={`inventory-panel ${isOpen ? 'inventory-panel--open' : ''}`}>
      <div className="inventory-panel__header">
        <span>INVENTORY</span>
        <button className="inventory-panel__close" onClick={onClose}>
          [ESC]
        </button>
      </div>

      <div className="inventory-panel__items">
        {inventory.length === 0 ? (
          <div className="inventory-panel__empty">
            Your pack is empty.
          </div>
        ) : (
          inventory.map(item => (
            <div key={item.id} className="inventory-panel__item-group">
              <button
                className={`inventory-panel__item ${selectedItem?.id === item.id ? 'inventory-panel__item--selected' : ''}`}
                onClick={() => handleItemClick(item)}
              >
                <span className="inventory-panel__icon">{item.icon}</span>
                <span className="inventory-panel__name">{item.name}</span>
              </button>
              {selectedItem?.id === item.id && (
                <div className="inventory-panel__description">
                  {item.description}
                  {item.realLink && (
                    <a
                      className="inventory-panel__link"
                      href={item.realLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      [Download]
                    </a>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
