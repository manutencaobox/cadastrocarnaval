import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Cadastro from './pages/Cadastro'
import Confirmacao from './pages/Confirmacao'
import Admin, { AdminLogin } from './pages/Admin'
import SuperAdmin, { SuperAdminLogin } from './pages/SuperAdmin'
import AjudaMedidas from './pages/AjudaMedidas'
import EscolaHome from './pages/EscolaHome'
import { getSlugFromHostname, useEscola } from './hooks/useEscola'

// Placeholders
const Landing = () => <div style={{padding:40,textAlign:'center',fontFamily:'system-ui'}}><h1>CadastroCarnaval</h1><p>Landing page em breve.</p></div>

export default function App() {
  // Subdomínio de escola (mox.cadastrocarnaval.com.br) → home da escola.
  // O hook também aplica as cores da escola nas variáveis CSS globais,
  // para que /admin/login e demais telas herdem a identidade visual.
  const slugEscola = getSlugFromHostname()
  useEscola()

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                   element={slugEscola ? <EscolaHome /> : <Landing />} />
        <Route path="/cadastro/:token"    element={<Cadastro />} />
        <Route path="/confirmacao"        element={<Confirmacao />} />
        <Route path="/ajuda/medidas"      element={<AjudaMedidas />} />
        <Route path="/admin/login"        element={<AdminLogin />} />
        <Route path="/admin/*"            element={<Admin />} />
        <Route path="/superadmin/login"   element={<SuperAdminLogin />} />
        <Route path="/superadmin/*"       element={<SuperAdmin />} />
      </Routes>
    </BrowserRouter>
  )
}
