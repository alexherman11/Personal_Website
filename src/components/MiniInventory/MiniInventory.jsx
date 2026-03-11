import './MiniInventory.css'

export default function MiniInventory({ inventory, onClick }) {
  return (
    <div className="mini-inventory" onClick={onClick} title="Inventory [I]">
      <div className="mini-inventory__label">INV</div>
      <div className="mini-inventory__count">
        {inventory.length === 0 ? '-' : inventory.length}
      </div>
      {inventory.length > 0 && (
        <div className="mini-inventory__icons">
          {inventory.slice(0, 4).map(item => (
            <span key={item.id} className="mini-inventory__icon">
              {item.icon}
            </span>
          ))}
          {inventory.length > 4 && <span className="mini-inventory__more">+</span>}
        </div>
      )}
    </div>
  )
}
