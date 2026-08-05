import { useState, useEffect } from 'react'
import './App.css'

// URL base del backend Express
const API_URL = 'https://vercel.app'

function App() {
  // -------------------------------------------------------------
  // ESTADOS DE AUTENTICACIÓN
  // -------------------------------------------------------------
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loginUsername, setLoginUsername] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  // -------------------------------------------------------------
  // ESTADOS DE CRUD COMPUTADORAS
  // -------------------------------------------------------------
  const [computadoras, setComputadoras] = useState([])
  const [loadingPcs, setLoadingPcs] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [toast, setToast] = useState(null)

  // Estado del Modal (Crear / Editar)
  const [showModal, setShowModal] = useState(false)
  const [editingPc, setEditingPc] = useState(null)
  const [formData, setFormData] = useState({
    marca: '',
    modelo: '',
    procesador: '',
    ram: '',
    almacenamiento_gb: '',
    tipo_almacenamiento: 'SSD',
    precio: ''
  })
  const [formSaving, setFormSaving] = useState(false)

  // Estado del Modal de Eliminación
  const [deletingPc, setDeletingPc] = useState(null)

  // Restaurar sesión activa desde localStorage al cargar
  useEffect(() => {
    const savedUser = localStorage.getItem('techspec_user')
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser)
        setUser(parsed)
        setIsAuthenticated(true)
      } catch (e) {
        localStorage.removeItem('techspec_user')
      }
    }
  }, [])

  // Cargar computadoras al iniciar sesión
  useEffect(() => {
    if (isAuthenticated) {
      fetchComputadoras()
    }
  }, [isAuthenticated])

  // Mostrar notificación emergente (Toast)
  const showNotification = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => {
      setToast(null)
    }, 3500)
  }

  // -------------------------------------------------------------
  // MANEJADORES DE AUTENTICACIÓN
  // -------------------------------------------------------------
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginError('')

    if (!loginUsername.trim() || !loginPassword.trim()) {
      setLoginError('Por favor ingrese usuario y contraseña')
      return
    }

    setLoginLoading(true)

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginUsername.trim(),
          password: loginPassword.trim()
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error en las credenciales')
      }

      // Sesión exitosa
      setUser(data.user)
      setIsAuthenticated(true)
      localStorage.setItem('techspec_user', JSON.stringify(data.user))
      showNotification(`¡Bienvenido de nuevo, ${data.user.username}!`, 'success')
    } catch (err) {
      setLoginError(err.message)
    } finally {
      setLoginLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('techspec_user')
    setUser(null)
    setIsAuthenticated(false)
    setLoginUsername('')
    setLoginPassword('')
    setComputadoras([])
  }

  // -------------------------------------------------------------
  // MANEJADORES DEL CRUD
  // -------------------------------------------------------------
  const fetchComputadoras = async () => {
    setLoadingPcs(true)
    try {
      const response = await fetch(`${API_URL}/computadoras`)
      if (!response.ok) throw new Error('Error al cargar la lista de computadoras')
      const data = await response.json()
      setComputadoras(data)
    } catch (err) {
      showNotification(err.message, 'error')
    } finally {
      setLoadingPcs(false)
    }
  }

  const handleOpenCreateModal = () => {
    setEditingPc(null)
    setFormData({
      marca: '',
      modelo: '',
      procesador: '',
      ram: '16',
      almacenamiento_gb: '512',
      tipo_almacenamiento: 'SSD',
      precio: ''
    })
    setShowModal(true)
  }

  const handleOpenEditModal = (pc) => {
    setEditingPc(pc)
    setFormData({
      marca: pc.marca || '',
      modelo: pc.modelo || '',
      procesador: pc.procesador || '',
      ram: pc.ram || '',
      almacenamiento_gb: pc.almacenamiento_gb || '',
      tipo_almacenamiento: pc.tipo_almacenamiento || 'SSD',
      precio: pc.precio || ''
    })
    setShowModal(true)
  }

  const handleSavePc = async (e) => {
    e.preventDefault()
    setFormSaving(true)

    const payload = {
      marca: formData.marca.trim(),
      modelo: formData.modelo.trim(),
      procesador: formData.procesador.trim(),
      ram: Number(formData.ram),
      almacenamiento_gb: Number(formData.almacenamiento_gb),
      tipo_almacenamiento: formData.tipo_almacenamiento,
      precio: Number(formData.precio)
    }

    try {
      const url = editingPc
        ? `${API_URL}/computadoras/${editingPc.id_compu}`
        : `${API_URL}/computadoras`

      const method = editingPc ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) throw new Error('No se pudo guardar la información del equipo')

      showNotification(
        editingPc ? 'Computadora actualizada con éxito' : 'Nueva computadora añadida correctamente',
        'success'
      )
      setShowModal(false)
      fetchComputadoras()
    } catch (err) {
      showNotification(err.message, 'error')
    } finally {
      setFormSaving(false)
    }
  }

  const handleDeletePc = async () => {
    if (!deletingPc) return

    try {
      const response = await fetch(`${API_URL}/computadoras/${deletingPc.id_compu}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Error al eliminar el equipo')
      showNotification(`Computadora ${deletingPc.marca} ${deletingPc.modelo} eliminada`, 'success')
      setDeletingPc(null)
      fetchComputadoras()
    } catch (err) {
      showNotification(err.message, 'error')
    }
  }

  // Filtrado dinámico por término de búsqueda
  const filteredComputadoras = computadoras.filter(pc => {
    const q = searchTerm.toLowerCase()
    return (
      (pc.marca && pc.marca.toLowerCase().includes(q)) ||
      (pc.modelo && pc.modelo.toLowerCase().includes(q)) ||
      (pc.procesador && pc.procesador.toLowerCase().includes(q)) ||
      (pc.tipo_almacenamiento && pc.tipo_almacenamiento.toLowerCase().includes(q))
    )
  })

  // Cálculos para Dashboard Metrics
  const totalPcs = computadoras.length
  const avgRam = totalPcs > 0 ? (computadoras.reduce((sum, p) => sum + Number(p.ram || 0), 0) / totalPcs).toFixed(0) : 0
  const totalValue = computadoras.reduce((sum, p) => sum + Number(p.precio || 0), 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })
  const ssdCount = computadoras.filter(p => (p.tipo_almacenamiento || '').toUpperCase().includes('SSD') || (p.tipo_almacenamiento || '').toUpperCase().includes('NVME')).length

  // -------------------------------------------------------------
  // VISTA 1: FORMULARIO DE LOGIN (SI NO ESTÁ AUTENTICADO)
  // -------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="login-wrapper">
        <div className="login-card">
          <div className="login-header">
            <div className="brand-badge">
              <span>⚡</span> SystemPC Auth
            </div>
            <h1 className="login-title">Iniciar Sesión</h1>
            <p className="login-subtitle">Ingrese las credenciales del sistema para gestionar el CRUD de computadoras</p>
          </div>

          {loginError && (
            <div className="error-alert">
              <span>⚠️</span>
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="username">Usuario</label>
              <div className="input-container">
                <span className="input-icon">👤</span>
                <input
                  id="username"
                  type="text"
                  className="form-input"
                  placeholder="Ej. admin"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <div className="input-container">
                <span className="input-icon">🔒</span>
                <input
                  id="password"
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loginLoading}>
              {loginLoading ? (
                <>
                  <div className="spinner"></div>
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <span>Ingresar al Sistema</span>
                  <span>→</span>
                </>
              )}
            </button>
          </form>
        </div>
        <footer className="app-footer" style={{ position: 'absolute', bottom: '1rem', background: 'transparent', borderTop: 'none' }}>
          <span>©</span> <span>2026 Hetsan. Todos los derechos reservados.</span>
        </footer>
      </div>
    )
  }

  // -------------------------------------------------------------
  // VISTA 2: PANEL CRUD DE COMPUTADORAS (AUTENTICADO)
  // -------------------------------------------------------------
  return (
    <div className="dashboard-layout app-container">
      {/* Toast Notification */}
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>
            <span>{toast.type === 'success' ? '✅' : '⚠️'}</span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Navbar Header */}
      <header className="navbar">
        <div className="nav-brand">
          <div className="brand-icon">💻</div>
          <div>
            <div className="nav-title">TechSpec CRUD</div>
            <div className="nav-subtitle">Gestión de Inventario de Computadoras</div>
          </div>
        </div>

        <div className="user-profile">
          <div className="user-badge">
            <div className="user-avatar">{user?.username ? user.username[0].toUpperCase() : 'A'}</div>
            <span>{user?.username || 'Admin'}</span>
          </div>
          <button className="btn-logout" onClick={handleLogout} title="Cerrar Sesión">
            <span>🚪</span>
            <span>Salir</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content animate-fade-in">
        {/* Metric Summary Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon-wrapper stat-icon-indigo">🖥️</div>
            <div className="stat-info">
              <div className="stat-label">Total Equipos</div>
              <div className="stat-value">{totalPcs}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper stat-icon-emerald">💰</div>
            <div className="stat-info">
              <div className="stat-label">Valor Total</div>
              <div className="stat-value">Q {totalValue}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper stat-icon-cyan">⚡</div>
            <div className="stat-info">
              <div className="stat-label">RAM Promedio</div>
              <div className="stat-value">{avgRam} GB</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper stat-icon-amber">💾</div>
            <div className="stat-info">
              <div className="stat-label">SSD / High Speed</div>
              <div className="stat-value">{ssdCount} de {totalPcs}</div>
            </div>
          </div>
        </div>

        {/* Action Control Bar (Search & Add Button) */}
        <div className="control-bar">
          <div className="search-wrapper">
            <input
              type="text"
              className="search-input"
              placeholder="🔍 Buscar por marca, modelo, procesador o almacenamiento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button className="btn-add" onClick={handleOpenCreateModal}>
            <span>➕</span>
            <span>Nueva Computadora</span>
          </button>
        </div>

        {/* Computadoras Data Table */}
        <div className="table-card">
          <div className="table-responsive">
            <table className="pc-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Marca & Modelo</th>
                  <th>Procesador</th>
                  <th>Memoria RAM</th>
                  <th>Almacenamiento</th>
                  <th>Precio</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loadingPcs ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '3rem' }}>
                      <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
                      <span style={{ color: 'var(--text-muted)' }}>Cargando inventario...</span>
                    </td>
                  </tr>
                ) : filteredComputadoras.length === 0 ? (
                  <tr>
                    <td colSpan="7">
                      <div className="empty-state">
                        <div className="empty-icon">📂</div>
                        <h3>No se encontraron computadoras</h3>
                        <p>{searchTerm ? 'Intenta con otro término de búsqueda' : 'Registra la primera computadora en el sistema'}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredComputadoras.map((pc) => (
                    <tr key={pc.id_compu}>
                      <td>
                        <span style={{ fontFamily: 'var(--mono)', opacity: 0.7 }}>#{pc.id_compu}</span>
                      </td>
                      <td>
                        <div>
                          <strong style={{ fontSize: '1rem', color: 'white' }}>{pc.marca}</strong>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{pc.modelo}</div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-brand">{pc.procesador}</span>
                      </td>
                      <td>
                        <span className="badge badge-ram">{pc.ram} GB</span>
                      </td>
                      <td>
                        <span className="badge badge-storage">
                          {pc.almacenamiento_gb} GB ({pc.tipo_almacenamiento})
                        </span>
                      </td>
                      <td>
                        <span className="price-tag">Q {Number(pc.precio).toFixed(2)}</span>
                      </td>
                      <td>
                        <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                          <button
                            className="btn-icon btn-icon-edit"
                            onClick={() => handleOpenEditModal(pc)}
                            title="Editar Equipo"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-icon btn-icon-delete"
                            onClick={() => setDeletingPc(pc)}
                            title="Eliminar Equipo"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* MODAL CREAR / EDITAR COMPUTADORA */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in">
            <div className="modal-header">
              <h2 className="modal-title">{editingPc ? 'Editar Computadora' : 'Nueva Computadora'}</h2>
              <button className="btn-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSavePc}>
              <div className="modal-grid">
                <div className="form-group">
                  <label htmlFor="marca">Marca *</label>
                  <input
                    id="marca"
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: '1rem' }}
                    placeholder="Ej. HP, Dell, Asus"
                    required
                    value={formData.marca}
                    onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="modelo">Modelo *</label>
                  <input
                    id="modelo"
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: '1rem' }}
                    placeholder="Ej. Envy 15, Pavilion"
                    required
                    value={formData.modelo}
                    onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="procesador">Procesador *</label>
                  <input
                    id="procesador"
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: '1rem' }}
                    placeholder="Ej. Intel Core i7-12700H / AMD Ryzen 7"
                    required
                    value={formData.procesador}
                    onChange={(e) => setFormData({ ...formData, procesador: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="ram">Memoria RAM (GB) *</label>
                  <input
                    id="ram"
                    type="number"
                    min="1"
                    className="form-input"
                    style={{ paddingLeft: '1rem' }}
                    placeholder="16"
                    required
                    value={formData.ram}
                    onChange={(e) => setFormData({ ...formData, ram: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="almacenamiento_gb">Almacenamiento (GB) *</label>
                  <input
                    id="almacenamiento_gb"
                    type="number"
                    min="1"
                    className="form-input"
                    style={{ paddingLeft: '1rem' }}
                    placeholder="512"
                    required
                    value={formData.almacenamiento_gb}
                    onChange={(e) => setFormData({ ...formData, almacenamiento_gb: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="tipo_almacenamiento">Tipo de Almacenamiento *</label>
                  <select
                    id="tipo_almacenamiento"
                    className="form-input"
                    style={{ paddingLeft: '1rem' }}
                    value={formData.tipo_almacenamiento}
                    onChange={(e) => setFormData({ ...formData, tipo_almacenamiento: e.target.value })}
                  >
                    <option value="SSD">SSD</option>
                    <option value="NVMe">NVMe</option>
                    <option value="HDD">HDD</option>
                    <option value="Híbrido">Híbrido</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="precio">Precio (Q Quetzales) *</label>
                  <input
                    id="precio"
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-input"
                    style={{ paddingLeft: '1rem' }}
                    placeholder="4500.00"
                    required
                    value={formData.precio}
                    onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" style={{ width: 'auto' }} disabled={formSaving}>
                  {formSaving ? 'Guardando...' : editingPc ? 'Guardar Cambios' : 'Crear Computadora'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMACIÓN DE ELIMINACIÓN */}
      {deletingPc && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '420px', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🗑️</div>
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>¿Eliminar esta computadora?</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Esta acción no se puede deshacer. Se borrará el registro de <strong>{deletingPc.marca} {deletingPc.modelo}</strong> (#{deletingPc.id_compu}).
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button className="btn-secondary" onClick={() => setDeletingPc(null)}>
                Cancelar
              </button>
              <button className="btn-danger" onClick={handleDeletePc}>
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Institucional */}
      <footer className="app-footer">
        <span>©</span> <span>2026 Hetsan. Todos los derechos reservados.</span>
      </footer>
    </div>
  )
}

export default App
