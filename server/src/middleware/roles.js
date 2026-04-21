export function requireRol(...roles) {
  return (req, res, next) => {
    if (!req.usuario) return res.status(401).json({ error: 'No autenticado' })
    if (!roles.includes(req.usuario.rol)) {
      return res.status(403).json({ error: 'Permiso insuficiente' })
    }
    next()
  }
}
