import { useState } from 'react'
import { X, Settings, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useProfileLocalStorage } from '../hooks/useProfileLocalStorage';

const sidebarColors = [
  { name: 'primary', color: 'bg-purple-500', active: true },
  { name: 'secondary', color: 'bg-blue-500', active: false },
  { name: 'accent', color: 'bg-yellow-500', active: false },
]

interface ThemeConfiguratorProps {
  isOpen: boolean
  onClose: () => void
}

export function ThemeConfigurator({ isOpen, onClose }: ThemeConfiguratorProps) {
  const [selectedColor, setSelectedColor] = useState<'primary' | 'secondary' | 'accent'>('primary')
  const [sidenavType, setSidenavType] = useState('transparent')
  const [navbarFixed, setNavbarFixed] = useState(true)
  const [darkMode, setDarkMode] = useState(false)

  const tenantId = ''; // TODO: obtener desde AuthContext
  const { setDraft } = useProfileLocalStorage(tenantId);

  function onColorChange(next: { primary_color?: string; secondary_color?: string; accent_color?: string; font_family?: string; layout_style?: string }) {
    setDraft('theme', next);
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      {/* Configurator Panel */}
      <div className="relative w-80 bg-white shadow-2xl h-full overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Settings className="w-5 h-5 text-gray-700" />
              <h3 className="text-lg font-semibold text-gray-900">Configuración de Tema</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Colores del tema */}
          <div className="mb-8">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Colores</h4>
            <div className="flex space-x-2">
              {sidebarColors.map((color) => (
                <button
                  key={color.name}
                  onClick={() => {
                    setSelectedColor(color.name as 'primary' | 'secondary' | 'accent')
                    const preset = color.name === 'primary'
                      ? { primary_color: '#7c3aed' }
                      : color.name === 'secondary'
                      ? { secondary_color: '#1e40af' }
                      : { accent_color: '#ffffff' };
                    onColorChange(preset);
                  }}
                  className={`w-6 h-6 rounded-full ${color.color} ${
                    selectedColor === color.name ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                  }`}
                />
              ))}
            </div>

            <div className="mt-4 space-y-3">
              <input
                type="text"
                placeholder="#HEX primario"
                className="w-full border rounded p-2 text-sm"
                onBlur={(e) => onColorChange({ primary_color: e.target.value })}
              />
              <input
                type="text"
                placeholder="#HEX secundario"
                className="w-full border rounded p-2 text-sm"
                onBlur={(e) => onColorChange({ secondary_color: e.target.value })}
              />
              <input
                type="text"
                placeholder="#HEX acento"
                className="w-full border rounded p-2 text-sm"
                onBlur={(e) => onColorChange({ accent_color: e.target.value })}
              />
            </div>
          </div>

          {/* Sidenav Type */}
          <div className="mb-8">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Sidenav Type</h4>
            <p className="text-xs text-gray-500 mb-3">Choose between different sidenav types.</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSidenavType('transparent')}
                className={`p-3 text-xs font-medium rounded border-2 ${
                  sidenavType === 'transparent'
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 bg-white text-gray-700'
                }`}
              >
                Transparent
              </button>
              <button
                onClick={() => setSidenavType('white')}
                className={`p-3 text-xs font-medium rounded border-2 ${
                  sidenavType === 'white'
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 bg-white text-gray-700'
                }`}
              >
                White
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">You can change the sidenav type just on desktop view.</p>
          </div>

          {/* Navbar Fixed */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-900">Navbar Fixed</h4>
              <button
                onClick={() => setNavbarFixed(!navbarFixed)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  navbarFixed ? 'bg-purple-500' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    navbarFixed ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Light/Dark Mode */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-900">Light / Dark</h4>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  darkMode ? 'bg-purple-500' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    darkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 mb-8">
            <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              Free Download
            </Button>
            <Button variant="outline" className="w-full">
              <ExternalLink className="w-4 h-4 mr-2" />
              View documentation
            </Button>
          </div>

          {/* Social Share */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">¡Gracias por compartir!</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex space-x-2">
                <Button size="sm" className="flex-1 bg-blue-500 hover:bg-blue-600">
                  Tweet
                </Button>
                <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700">
                  Share
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}